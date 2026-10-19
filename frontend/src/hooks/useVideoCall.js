import { useCallback, useEffect, useRef, useState } from "react";

import { socket } from "../socket";

// The browser side of one video call (WebRTC). The server only passes the connection messages
// between the two people (Socket.IO); the video itself goes directly between the browsers.
//
//   visitId   the video visit
//   enabled   false until the screen knows the visit exists and the call is on
//
// Roles: the DOCTOR makes the offer; the PATIENT answers. Whoever joins later is noticed by the other,
// so a refresh or a lost connection can be repaired by joining again.
//
// Returns {
//   phase     "preparing" | "waiting" | "connecting" | "connected" | "ended" | "replaced" | "error"
//   error, notice, role,
//   localStream, remoteStream   (MediaStream or null: put them in <video> elements)
//   micOn, camOn, hasCamera, toggleMic(), toggleCam(),
//   leave()                     leave the call (the doctor ends the visit separately)
// }
const RESTART_AFTER_MS = 4000; // a "failed" connection is retried by the doctor after this time

export default function useVideoCall(visitId, enabled = true) {
  const [phase, setPhase] = useState("preparing");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [role, setRole] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);

  const stream = useRef(null);
  const leaveRef = useRef(() => {});

  useEffect(() => {
    if (!enabled || !visitId) return undefined;

    let cancelled = false;
    let pc = null;
    let myRole = null;
    let iceServers = [];
    let queued = []; // candidates that arrived before the offer/answer was set
    let restartTimer = null;
    let joined = false;

    const finish = (next, text) => {
      if (cancelled) return;
      setPhase(next);
      if (text) setError(text);
    };

    const sendSignal = (data) => socket.emit("call:signal", { visitId, data });

    function closePeer() {
      clearTimeout(restartTimer);
      queued = [];
      if (pc) {
        pc.ontrack = pc.onicecandidate = pc.onconnectionstatechange = null;
        pc.close();
        pc = null;
      }
      setRemoteStream(null);
    }

    // A new connection object for every offer: simpler and safer than renegotiating an old one
    function newPeer() {
      closePeer();
      pc = new RTCPeerConnection({ iceServers });
      const mine = pc;

      stream.current?.getTracks().forEach((track) => mine.addTrack(track, stream.current));

      mine.ontrack = (event) => {
        if (mine === pc) setRemoteStream(event.streams[0] || new MediaStream([event.track]));
      };
      mine.onicecandidate = (event) => {
        if (event.candidate && mine === pc) sendSignal({ type: "candidate", candidate: event.candidate.toJSON() });
      };
      mine.onconnectionstatechange = () => {
        if (mine !== pc || cancelled) return;
        const state = mine.connectionState;
        if (state === "connected") {
          clearTimeout(restartTimer);
          setNotice(null);
          setPhase("connected");
        } else if (state === "disconnected") {
          setPhase("connecting");
          setNotice("The connection is unstable. Trying to reconnect...");
        } else if (state === "failed") {
          setPhase("connecting");
          setNotice("The connection was lost. Trying again...");
          if (myRole === "doctor") restartTimer = setTimeout(() => makeOffer(true), RESTART_AFTER_MS);
        }
      };
      return mine;
    }

    async function makeOffer(restart = false) {
      if (myRole !== "doctor" || cancelled) return;
      try {
        // A restart keeps the same connection; a first offer starts a fresh one
        const mine = restart && pc ? pc : newPeer();
        setPhase((p) => (p === "connected" ? p : "connecting"));
        const offer = await mine.createOffer(restart ? { iceRestart: true } : undefined);
        await mine.setLocalDescription(offer);
        sendSignal({ type: "offer", sdp: offer.sdp });
      } catch (err) {
        console.log("Could not make the offer:", err.message);
        finish("error", "Could not start the video connection.");
      }
    }

    async function flushQueued(mine) {
      const list = queued;
      queued = [];
      for (const candidate of list) {
        try {
          await mine.addIceCandidate(candidate);
        } catch {
          /* a stale candidate is harmless */
        }
      }
    }

    async function onSignal({ from, data }) {
      if (cancelled || !data) return;
      try {
        if (data.type === "offer" && myRole === "patient" && from === "doctor") {
          const mine = newPeer();
          setPhase("connecting");
          await mine.setRemoteDescription({ type: "offer", sdp: data.sdp });
          await flushQueued(mine);
          const answer = await mine.createAnswer();
          await mine.setLocalDescription(answer);
          sendSignal({ type: "answer", sdp: answer.sdp });
        } else if (data.type === "answer" && myRole === "doctor" && pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
          await flushQueued(pc);
        } else if (data.type === "candidate" && data.candidate) {
          if (pc && pc.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => {});
          else queued.push(data.candidate);
        }
      } catch (err) {
        console.log("Signal failed:", err.message);
      }
    }

    function join() {
      socket.emit("call:join", { visitId }, (reply) => {
        if (cancelled) return;
        if (!reply || !reply.ok) {
          joined = false;
          finish("error", (reply && reply.message) || "Could not join the call.");
          return;
        }
        joined = true;
        myRole = reply.role;
        iceServers = reply.iceServers || [];
        setRole(reply.role);
        setError(null);
        setNotice(null);
        setPhase((p) => (p === "connected" ? p : "waiting"));
        if (reply.role === "doctor" && reply.peerPresent) makeOffer();
      });
    }

    const onPeerJoined = () => {
      setNotice(null);
      if (myRole === "doctor") makeOffer();
      else setPhase((p) => (p === "connected" ? p : "connecting"));
    };
    const onPeerLeft = () => {
      closePeer();
      setPhase("waiting");
      setNotice("The other person left the call. Waiting for them to come back...");
    };
    const onEnded = () => {
      closePeer();
      stopMedia();
      finish("ended");
    };
    const onReplaced = () => {
      closePeer();
      stopMedia();
      finish("replaced");
    };
    // The live connection came back after a drop: join again (the server forgot this socket)
    const onConnect = () => {
      if (joined) {
        closePeer();
        join();
      }
    };

    function stopMedia() {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      setLocalStream(null);
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        finish("error", "This browser cannot make video calls. Use a recent Chrome, Edge, Firefox or Safari, on https or localhost.");
        return;
      }

      let media = null;
      try {
        media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          media = await navigator.mediaDevices.getUserMedia({ audio: true }); // no camera: voice only
          setHasCamera(false);
          setCamOn(false);
        } catch {
          finish("error", "Allow the camera and microphone for this site, then reload the page.");
          return;
        }
      }
      if (cancelled) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      setLocalStream(media);

      socket.on("call:signal", onSignal);
      socket.on("call:peer-joined", onPeerJoined);
      socket.on("call:peer-left", onPeerLeft);
      socket.on("call:ended", onEnded);
      socket.on("call:replaced", onReplaced);
      socket.on("connect", onConnect);

      if (socket.connected) join();
      else {
        const once = () => {
          socket.off("connect", once);
          if (!cancelled && !joined) join();
        };
        socket.on("connect", once);
        socket.connect();
      }
    }

    leaveRef.current = () => {
      if (joined) socket.emit("call:leave", { visitId });
      joined = false;
      closePeer();
      stopMedia();
    };

    start();

    return () => {
      cancelled = true;
      socket.off("call:signal", onSignal);
      socket.off("call:peer-joined", onPeerJoined);
      socket.off("call:peer-left", onPeerLeft);
      socket.off("call:ended", onEnded);
      socket.off("call:replaced", onReplaced);
      socket.off("connect", onConnect);
      leaveRef.current();
    };
  }, [visitId, enabled]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    stream.current?.getAudioTracks().forEach((track) => (track.enabled = next));
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    if (!hasCamera) return;
    const next = !camOn;
    stream.current?.getVideoTracks().forEach((track) => (track.enabled = next));
    setCamOn(next);
  }, [camOn, hasCamera]);

  const leave = useCallback(() => leaveRef.current(), []);

  return { phase, error, notice, role, localStream, remoteStream, micOn, camOn, hasCamera, toggleMic, toggleCam, leave };
}
