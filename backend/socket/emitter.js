const { roomName } = require("./access");

// Sending live updates. Controllers call these AFTER the database change has succeeded,
// so the screens only ever show what is really saved.

// Every room has a counter that goes up by one per message. A screen that sees a gap
// (seq jumped) or that just reconnected loads a fresh snapshot instead of guessing.
// Kept in memory: fine for one server. A restart resets it, and the screens then see a
// mismatch and reload their snapshot on their own. (Several servers would need the
// Socket.IO Redis adapter and a shared counter.)
const counters = new Map();

function nextSeq(room) {
  const seq = (counters.get(room) || 0) + 1;
  counters.set(room, seq);
  return seq;
}

// Current counter of a room. The snapshot endpoints return this with the data, so a
// screen knows which message to expect next.
function currentSeq(room) {
  return counters.get(room) || 0;
}

// The queue changed. `change` is small, for example:
//   { type: "upsert", item: { appointmentId, tokenNumber, status, name } }
//   { type: "remove", appointmentId }
// Goes to the doctor and the receptionists of that doctor (the "queue" room).
// `deskChange` (optional) = extra fields only receptionists may see, for example a fuller `item`
// with the phone number. Receptionists get the change with these fields instead; the doctor gets
// the plain one. Both carry the same seq, so every screen still receives exactly one message.
function emitQueueChanged(io, doctorId, date, change, deskChange) {
  if (!io) return;
  const room = roomName.queue(doctorId, date);
  const seq = nextSeq(room);

  if (!deskChange) {
    io.to(room).emit("queue:changed", { seq, ...change });
    return;
  }
  const desk = roomName.desk(doctorId, date);
  io.to(room).except(desk).emit("queue:changed", { seq, ...change });
  io.to(desk).emit("queue:changed", { seq, ...change, ...deskChange });
}

// The public summary for patients: { token: 14, waiting: 6 }. No names, nothing private.
function emitNowServing(io, doctorId, date, summary) {
  if (!io) return;
  const room = roomName.now(doctorId, date);
  io.to(room).emit("now:serving", { seq: nextSeq(room), ...summary });
}

// A message for one person, on all their open tabs/devices. userId = MongoDB _id.
function emitToUser(io, userId, event, data) {
  if (!io) return;
  io.to(roomName.user(userId)).emit(event, data);
}

// When a receptionist is removed from a doctor, take them out of that doctor's queue rooms
// right away (otherwise a screen that is already open would keep receiving updates).
async function revokeQueueAccess(io, receptionistId, doctorId) {
  if (!io) return;

  const sockets = await io.in(roomName.user(String(receptionistId))).fetchSockets();
  for (const socket of sockets) {
    for (const room of socket.rooms) {
      if (room.startsWith(`queue:${doctorId}:`) || room.startsWith(`desk:${doctorId}:`)) socket.leave(room);
    }
    socket.emit("queue:revoked", { doctorId: String(doctorId) });
  }
}

module.exports = { currentSeq, emitQueueChanged, emitNowServing, emitToUser, revokeQueueAccess };
