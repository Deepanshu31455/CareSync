const Appointment = require("../models/Appointment");
const DayCounter = require("../models/DayCounter");
const Payment = require("../models/Payment");
const { endOfDatePlusDays } = require("../utils/dates");
const { emitQueueChanged, emitNowServing } = require("../socket/emitter");
const mongoose = require("mongoose");

// The shared queue logic. The receptionist's walk-in route uses it now; the patient
// booking route will use the very same functions, so both always behave the same way.

const WALK_IN_KEEP_DAYS = 7; // walk-in records are deleted this many days after their visit
const COUNTER_KEEP_DAYS = 3; // a day's token counter is deleted this many days after that day

const isDuplicate = (err) => err && err.code === 11000;

// The next token number for a doctor on a date. One atomic update.
async function nextToken(doctor, date) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const counter = await DayCounter.findOneAndUpdate(
        { doctor, date },
        { $inc: { lastToken: 1 }, $setOnInsert: { expireAt: endOfDatePlusDays(date, COUNTER_KEEP_DAYS) } },
        { upsert: true, new: true }
      );
      return counter.lastToken;
    } catch (err) {
      // Two first-ever requests for the day can collide on creating the counter: just try again
      if (!isDuplicate(err) || attempt === 2) throw err;
    }
  }
}

// Gives the person the next token and saves the appointment.
// data = { doctor, date, source, patient?, walkIn?, paymentStatus?, paymentRef?, addedBy?, rescheduledFrom? }
async function createAppointment(data) {
  const purgeAt = data.source === "walk_in" ? endOfDatePlusDays(data.date, WALK_IN_KEEP_DAYS) : undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    const tokenNumber = await nextToken(data.doctor, data.date);
    try {
      return await Appointment.create({ ...data, tokenNumber, purgeAt });
    } catch (err) {
      // A token number was already used (a lost counter): take the next one
      if (!isDuplicate(err) || attempt === 2) throw err;
    }
  }
}

// The public numbers of a queue: the token in consultation, how many are still waiting, and the
// token numbers of those waiting (numbers only, no names). With the list, a patient's screen can work
// out "people ahead of me" by itself, so it does not need to ask the server after every change.
const MAX_TOKENS_LISTED = 300;

async function summary(doctor, date) {
  const [serving, waiting, waitingRows] = await Promise.all([
    Appointment.findOne({ doctor, date, status: "in_consultation" }).select("tokenNumber").lean(),
    Appointment.countDocuments({ doctor, date, status: "waiting" }),
    Appointment.find({ doctor, date, status: "waiting" }).select("tokenNumber").sort({ tokenNumber: 1 }).limit(MAX_TOKENS_LISTED).lean(),
  ]);
  return {
    nowServing: serving ? serving.tokenNumber : null,
    waiting,
    waitingTokens: waitingRows.map((row) => row.tokenNumber),
  };
}

function ageFromDob(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// One queue row as the screens receive it. The doctor sees the same row as the receptionist,
// except that the phone number is only for the receptionist.
//   appointment = a plain object; for online bookings `patient` must be loaded (fullName, dob, gender)
function formatItem(appointment, { withPhone = false } = {}) {
  const online = appointment.source === "online" && appointment.patient && appointment.patient.fullName;

  const item = {
    appointmentId: String(appointment._id),
    date: appointment.date,
    tokenNumber: appointment.tokenNumber,
    status: appointment.status,
    source: appointment.source,
    paymentStatus: appointment.paymentStatus,
    name: online ? appointment.patient.fullName : appointment.walkIn?.name || "Patient",
    age: online ? ageFromDob(appointment.patient.dob) : appointment.walkIn?.age ?? null,
    gender: online ? appointment.patient.gender : appointment.walkIn?.gender || null,
  };
  if (withPhone && appointment.walkIn?.phone) item.phone = appointment.walkIn.phone;
  return item;
}

// Tell every open screen that one appointment changed. Call this AFTER the change is saved.
async function publishChange(io, appointmentId) {
  if (!io) return;

  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "fullName dob gender")
    .lean();
  if (!appointment) return;

  const { doctor, date } = appointment;
  const { nowServing, waiting, waitingTokens } = await summary(doctor, date);

  // The doctor's screen gets the row without a phone number. Receptionists get the same change
  // with the phone number (see emitQueueChanged), so their screens never lose it.
  emitQueueChanged(
    io,
    doctor,
    date,
    { type: "upsert", item: formatItem(appointment), nowServing, waiting },
    { item: formatItem(appointment, { withPhone: true }) }
  );
  // The patients' room: says which doctor and day it is about, so one screen can follow several queues
  emitNowServing(io, doctor, date, { doctorId: String(doctor), date, token: nowServing, waiting, waitingTokens });
}

// Cancels an appointment that is still WAITING (`filter` says whose: by patient, or by doctor).
// A paid online booking becomes "refund_pending": the clinic has to return the money.
// Used by the patient's own "Cancel" and by the receptionist's "Cancel", so both behave the same.
// Returns { cancelled, refund }; cancelled is null when nothing matched.
async function cancelWaiting(filter) {
  const waiting = { ...filter, status: "waiting" };

  let cancelled = await Appointment.findOneAndUpdate(
    { ...waiting, paymentStatus: "paid" },
    { status: "cancelled", paymentStatus: "refund_pending" },
    { new: true }
  );
  const refund = Boolean(cancelled);
  if (!cancelled) cancelled = await Appointment.findOneAndUpdate(waiting, { status: "cancelled" }, { new: true });

  if (refund && cancelled.paymentRef && mongoose.isValidObjectId(cancelled.paymentRef)) {
    await Payment.updateOne({ _id: cancelled.paymentRef, status: "paid" }, { status: "refund_pending" });
  }
  return { cancelled, refund };
}

module.exports = {
  cancelWaiting,
  WALK_IN_KEEP_DAYS,
  nextToken,
  createAppointment,
  summary,
  formatItem,
  ageFromDob,
  publishChange,
  isDuplicate,
};
