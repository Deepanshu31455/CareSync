import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { socket } from "../socket";
import { API_BASE } from "../config";
import {
  queueOpened,
  snapshotLoaded,
  changeApplied,
  nowServingChanged,
  setConnection,
  setError,
  queueClosed,
} from "../redux/queueSlice";

// How often to refresh by plain requests while the live connection is down
const FALLBACK_POLL_MS = 10000;

// Live queue of one doctor on one day.
//   doctorId      the doctor's 6-digit ID (the server turns it into the database id)
//   mode "queue"  doctor / receptionist: the full queue
//   mode "now"    patient: only the number being served and how many are waiting
//   date          "2026-10-13"
//
// How it stays correct:
//  1. open the connection and JOIN the room (the server checks you may)
//  2. then load a SNAPSHOT (full picture + the number of the last message it includes)
//  3. apply live messages one by one; if one is missing, load a fresh snapshot
//  4. if the connection drops, show "offline", refresh every 10 s, and join again on return
//
// The snapshot addresses are added together with the booking step:
//   GET /queue/:doctorId?date=...        -> { items, nowServing, waiting, seq }   (staff)
//   GET /queue/:doctorId/now?date=...    -> { nowServing, waiting, seq }          (patients)
export default function useQueue({ doctorId, date, mode = "queue" }) {
  const dispatch = useDispatch();
  const queue = useSelector((state) => state.queue);
  const refreshRef = useRef(null); // lets the screen ask for a fresh snapshot (see `refresh` below)

  useEffect(() => {
    if (!doctorId || !date) return;

    const request = { kind: mode, doctorId, date };
    const snapshotUrl =
      mode === "now"
        ? `${API_BASE}/queue/${doctorId}/now?date=${date}`
        : `${API_BASE}/queue/${doctorId}?date=${date}`;

    let active = true; // false once this screen is closed
    let live = false; // joined and connected right now
    let lastSeq = null; // number of the last message applied (null = no snapshot yet)
    let loading = false; // a snapshot request is running
    let missed = false; // a message arrived while loading: load once more afterwards
    let roomDoctorId = null; // the doctor's database id, as the server reports it after joining

    dispatch(queueOpened({ doctorId, date }));
    refreshRef.current = loadSnapshot;

    // GET the full picture
    async function loadSnapshot() {
      if (loading) {
        missed = true;
        return;
      }
      loading = true;

      try {
        const res = await fetch(snapshotUrl, { method: "GET", credentials: "include" });
        const result = await res.json();

        if (!res.ok) throw new Error(result.message || "Could not load the queue.");
        if (!active) return;

        lastSeq = result.seq ?? 0;
        dispatch(snapshotLoaded(result));
      } catch (err) {
        if (active) dispatch(setError(err.message || "Could not connect to the server."));
      } finally {
        loading = false;
        if (missed && active) {
          missed = false;
          loadSnapshot();
        }
      }
    }

    // Ask the server to let us into the room, then load the snapshot
    function join() {
      socket.emit("queue:join", request, (reply) => {
        if (!active) return;

        if (!reply?.ok) {
          dispatch(setError(reply?.message || "Could not open the live queue."));
          return;
        }
        live = true;
        roomDoctorId = reply.doctorId;
        dispatch(setConnection("live"));
        loadSnapshot();
      });
    }

    function goOffline() {
      live = false;
      dispatch(setConnection("offline"));
    }

    // Staff screens: one change to the queue
    function onChanged(change) {
      if (lastSeq === null || loading) {
        missed = true; // the snapshot in progress may not include it: load again afterwards
        return;
      }
      if (change.seq <= lastSeq) return; // already included
      if (change.seq !== lastSeq + 1) {
        loadSnapshot(); // a message was missed
        return;
      }
      lastSeq = change.seq;
      dispatch(changeApplied(change));
    }

    // Patient screens: the latest summary (each message is complete, so just use the newest)
    function onNowServing(summary) {
      if (lastSeq !== null && summary.seq <= lastSeq) return;
      lastSeq = summary.seq;
      dispatch(nowServingChanged(summary));
    }

    // Removed from this doctor's queue while the screen was open
    function onRevoked(info) {
      // The screen is addressed by the 6-digit ID, the server reports the database id
      if (info.doctorId === roomDoctorId || info.doctorId === String(doctorId)) {
        live = false;
        dispatch(setError("You no longer have access to this queue."));
      }
    }

    socket.on("connect", join); // also runs after every reconnect (rooms are lost then)
    socket.on("disconnect", goOffline);
    socket.on("connect_error", goOffline);
    socket.on("queue:changed", onChanged);
    socket.on("now:serving", onNowServing);
    socket.on("queue:revoked", onRevoked);

    if (socket.connected) join();
    else socket.connect();

    // While not live, keep the screen fresh by plain requests
    const poll = setInterval(() => {
      if (!live) loadSnapshot();
    }, FALLBACK_POLL_MS);

    return () => {
      active = false;
      refreshRef.current = null;
      clearInterval(poll);
      socket.off("connect", join);
      socket.off("disconnect", goOffline);
      socket.off("connect_error", goOffline);
      socket.off("queue:changed", onChanged);
      socket.off("now:serving", onNowServing);
      socket.off("queue:revoked", onRevoked);
      socket.emit("queue:leave", request);
      dispatch(queueClosed());
    };
  }, [doctorId, date, mode, dispatch]);

  // refresh() loads a fresh snapshot by a plain request (used after an action while the live connection is down)
  return { ...queue, refresh: () => refreshRef.current && refreshRef.current() };
}
