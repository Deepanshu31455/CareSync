const mongoose = require("mongoose");

// One document = one working relationship between a doctor and a receptionist.
// This collection is the only place the relationship is stored, so the doctor's
// side and the receptionist's side can never disagree. Both profiles read from it.
//
//   pending   the receptionist asked, the doctor has not answered yet
//   active    the doctor accepted: they now work together
//   rejected  the doctor declined
//   cancelled the receptionist withdrew the request before an answer
//   ended     an active assignment that was removed (by either side)
//
// Ended / rejected / cancelled documents are kept as history, never deleted.
const assignmentSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
  receptionist: { type: mongoose.Schema.Types.ObjectId, ref: "Receptionist", required: true, index: true },

  status: {
    type: String,
    enum: ["pending", "active", "rejected", "cancelled", "ended"],
    default: "pending",
  },

  // "<doctorId>_<receptionistId>" while the assignment is pending or active, and
  // removed once it is closed. The unique + sparse index means the database itself
  // refuses a second open request / assignment for the same pair.
  pairKey: { type: String, unique: true, sparse: true },

  // The emailed link carries a random token. Only its hash is stored, so a
  // database leak cannot be used to accept requests. It is single-use and expires.
  tokenHash: { type: String, select: false, index: true },
  tokenExpires: { type: Date },

  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }, // when the doctor accepted or rejected (= "since" for active ones)
  endedAt: { type: Date },
  endedBy: { type: String, enum: ["doctor", "receptionist"] },
});

module.exports = mongoose.model("Assignment", assignmentSchema);
