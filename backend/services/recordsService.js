const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");

// The visit's entry in the patient's "Previous Consultations".
//
// Created once per visit, the first time it is needed: when the receptionist completes the visit
// or uploads a document for it. Safe to call again and again (and from two places at once):
// the appointment is claimed first with one atomic update, so only one entry is ever created.
//
// A patient who was rescheduled (for example to bring a test report back) continues the SAME
// entry: it is found by following `rescheduledFrom` back to the earlier visit.
//
// Returns the consultation's id, or null for people without an account (walk-ins keep no records).
async function ensureConsultation(appointmentId) {
  const appointment = await Appointment.findById(appointmentId)
    .select("doctor patient date source tokenNumber rescheduledFrom consultationId")
    .lean();

  if (!appointment || appointment.source !== "online" || !appointment.patient) return null;
  if (appointment.consultationId) return appointment.consultationId;

  // An earlier visit in the same chain may already have the entry
  let inherited = null;
  let previous = appointment.rescheduledFrom;
  for (let hops = 0; previous && hops < 10 && !inherited; hops++) {
    const earlier = await Appointment.findById(previous).select("consultationId rescheduledFrom").lean();
    if (!earlier) break;
    inherited = earlier.consultationId || null;
    previous = earlier.rescheduledFrom;
  }

  const consultationId = inherited || new mongoose.Types.ObjectId();

  // Claim: only one request can set the id on this appointment
  const claimed = await Appointment.findOneAndUpdate(
    { _id: appointmentId, consultationId: { $exists: false } },
    { consultationId },
    { new: true }
  );
  if (!claimed) {
    const winner = await Appointment.findById(appointmentId).select("consultationId").lean();
    return winner ? winner.consultationId || null : null;
  }

  if (inherited) return consultationId; // the entry already exists in the patient's history

  try {
    const result = await Patient.updateOne(
      { _id: appointment.patient },
      {
        $push: {
          consultations: {
            _id: consultationId,
            doctor: appointment.doctor,
            consultationDate: new Date(`${appointment.date}T00:00:00+05:30`), // the visit's day, Indian time
            reference: `Token ${appointment.tokenNumber}`,
          },
        },
      }
    );
    if (result && result.matchedCount === 0) throw new Error("The patient account no longer exists.");
  } catch (err) {
    await Appointment.updateOne({ _id: appointmentId }, { $unset: { consultationId: 1 } }); // let a later try go ahead
    throw err;
  }

  return consultationId;
}

module.exports = { ensureConsultation };
