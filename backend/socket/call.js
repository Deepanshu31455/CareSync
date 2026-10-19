const mongoose = require("mongoose");
const { getIceServers } = require("../utils/iceServers");

// The live part of a video call: it only passes the browsers' connection messages (WebRTC "signaling")
// between the doctor and the patient of ONE video visit. The video itself goes directly between the browsers.
//
//   call:join    { visitId }          -> ack { ok, role, peerPresent, iceServers }   (or { ok: false, message })
//   call:signal  { visitId, data }    passed on to the other person as "call:signal" { from, data }
//   call:leave   { visitId }
// The server tells the room: "call:peer-joined" / "call:peer-left" { role }, and "call:ended" (the doctor ended the call).
//
// Who may join: only the visit's own doctor and patient, and only while the call is on (status "in_consultation").

const MAX_SIGNAL_BYTES = 20 * 1024; // an offer with many candidates stays far below this
const SIGNAL_TYPES = ["offer", "answer", "candidate"];

const callRoom = (visitId) => `call:${visitId}`;

// deps = { findVisit(id) -> { doctor, patient, status } | null, getIceServers() }
function makeCallHandlers({ findVisit, iceServers = getIceServers, isValidObjectId = mongoose.isValidObjectId }) {
  return function registerCall(io, socket) {
    const roles = () => (socket.data.callRoles = socket.data.callRoles || {}); // visitId -> "doctor" | "patient"

    function leave(visitId) {
      const role = roles()[visitId];
      if (!role) return;
      delete roles()[visitId];
      socket.leave(callRoom(visitId));
      socket.to(callRoom(visitId)).emit("call:peer-left", { role });
    }

    socket.on("call:join", async (request, ack) => {
      const reply = (payload) => typeof ack === "function" && ack(payload);
      try {
        const visitId = request && request.visitId;
        if (!isValidObjectId(visitId)) return reply({ ok: false, message: "Video visit not found." });

        const visit = await findVisit(visitId);
        const me = socket.data.userId;
        const role = !visit ? null : String(visit.doctor) === me ? "doctor" : String(visit.patient) === me ? "patient" : null;
        if (!role) return reply({ ok: false, message: "You are not part of this call." });
        if (visit.status !== "in_consultation") return reply({ ok: false, message: "The call has not started, or it has ended." });

        const room = callRoom(visitId);

        // Another open tab of the same person leaves, so a call never has two doctors or two patients
        const inRoom = await io.in(room).fetchSockets();
        for (const other of inRoom) {
          if (other.id !== socket.id && other.data.callRoles && other.data.callRoles[visitId] === role) {
            other.emit("call:replaced");
            other.leave(room);
            delete other.data.callRoles[visitId];
          }
        }
        const peerPresent = inRoom.some(
          (other) => other.id !== socket.id && other.data.callRoles && other.data.callRoles[visitId] && other.data.callRoles[visitId] !== role
        );

        await socket.join(room);
        roles()[visitId] = role;
        socket.to(room).emit("call:peer-joined", { role });

        return reply({ ok: true, role, peerPresent, iceServers: iceServers() });
      } catch (err) {
        console.log("call:join failed:", err.message);
        return reply({ ok: false, message: "Could not join the call." });
      }
    });

    socket.on("call:signal", (message) => {
      const visitId = message && message.visitId;
      const role = visitId && roles()[visitId];
      const data = message && message.data;
      if (!role || !data || !SIGNAL_TYPES.includes(data.type)) return;
      if (JSON.stringify(data).length > MAX_SIGNAL_BYTES) return;

      socket.to(callRoom(visitId)).emit("call:signal", { from: role, data });
    });

    socket.on("call:leave", (request) => leave(request && request.visitId));

    // A closed tab or a lost connection: the other person is told
    socket.on("disconnecting", () => {
      for (const visitId of Object.keys(roles())) leave(visitId);
    });
  };
}

// The real one: reads the visit from the database
const registerCall = makeCallHandlers({
  findVisit: (id) => require("../models/VideoVisit").findById(id).select("doctor patient status").lean(),
});

module.exports = { makeCallHandlers, registerCall, callRoom };
