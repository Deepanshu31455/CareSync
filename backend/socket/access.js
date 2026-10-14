// Who may join which live room. Kept free of Socket.IO itself so it is easy to test.
//
//   "now"   room  every logged-in user (patients): only the public summary is sent there
//   "queue" room  the doctor themself, or a receptionist with an ACTIVE assignment to that doctor
//                 (the full queue with patient details is sent there)

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // 2026-10-13

const roomName = {
  queue: (doctorId, date) => `queue:${doctorId}:${date}`,
  now: (doctorId, date) => `now:${doctorId}:${date}`,
  user: (userId) => `user:${userId}`,
  // Receptionists only (they also sit in the "queue" room). Messages for this room carry phone numbers.
  desk: (doctorId, date) => `desk:${doctorId}:${date}`,
};

// models = { doctor, receptionist, patient }  (Mongoose models)
function makeAccess({ Assignment, models, isValidObjectId }) {
  // The login token's accountId can be the MongoDB _id or the login ID; return the _id as text.
  async function resolveUserId(role, accountId) {
    if (isValidObjectId(accountId)) return String(accountId);
    const Model = models[role];
    if (!Model) return null;
    const found = await Model.findOne({ id: accountId }).select("_id");
    return found ? String(found._id) : null;
  }

  // People use the doctor's 6-digit ID (never the MongoDB _id) in screens and addresses.
  // This turns it into the _id that the database uses. The MongoDB _id itself is also accepted
  // (older tools such as /socket-test). Returns the _id as text, or null when there is no such doctor.
  // A doctor's ID never changes, so a found answer is remembered.
  const knownDoctors = new Map();
  const MAX_KNOWN = 5000;

  async function resolveDoctorId(ref) {
    const text = String(ref ?? "").trim();
    if (isValidObjectId(text)) return text;
    if (!/^\d{6}$/.test(text)) return null;

    if (knownDoctors.has(text)) return knownDoctors.get(text);

    const found = await models.doctor.findOne({ id: text }).select("_id");
    if (!found) return null;

    if (knownDoctors.size >= MAX_KNOWN) knownDoctors.clear();
    knownDoctors.set(text, String(found._id));
    return String(found._id);
  }

  // Is this user allowed to work with this doctor's queue?
  //   the doctor themself, or a receptionist with an ACTIVE assignment to the doctor.
  // Returns { role, userId } (userId = MongoDB _id as text) or null.
  async function staffAccess(user, doctorId) {
    if (user.role === "doctor") {
      const myId = await resolveUserId("doctor", user.accountId);
      return myId === String(doctorId) ? { role: "doctor", userId: myId } : null;
    }

    if (user.role === "receptionist") {
      const myId = await resolveUserId("receptionist", user.accountId);
      const linked =
        myId && (await Assignment.exists({ doctor: doctorId, receptionist: myId, status: "active" }));
      return linked ? { role: "receptionist", userId: myId } : null;
    }

    return null;
  }

  // request = { kind: "queue" | "now", doctorId (6-digit ID), date }
  //   ->  { ok: true, room, doctorId (the _id) } or { ok: false, message }
  async function canJoin(user, request) {
    const { kind, doctorId: ref, date } = request || {};

    if (kind !== "queue" && kind !== "now") return { ok: false, message: "Unknown room." };

    const doctorId = await resolveDoctorId(ref);
    if (!doctorId || !DATE_RE.test(String(date))) {
      return { ok: false, message: "Invalid doctor or date." };
    }

    if (kind === "now") return { ok: true, room: roomName.now(doctorId, date), doctorId };

    // kind === "queue": staff only
    const staff = await staffAccess(user, doctorId);
    if (staff) {
      return { ok: true, room: roomName.queue(doctorId, date), doctorId, role: staff.role, date };
    }

    return { ok: false, message: "You do not have access to this queue." };
  }

  return { canJoin, resolveUserId, resolveDoctorId, staffAccess };
}

module.exports = { makeAccess, roomName, DATE_RE };
