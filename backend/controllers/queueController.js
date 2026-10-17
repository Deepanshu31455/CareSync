const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { todayIST, isValidDate, isDoctorOpenOn, addDays } = require("../utils/dates");
const { roomName } = require("../socket/access");
const { currentSeq } = require("../socket/emitter");
const { ensureConsultation } = require("../services/recordsService");
const { createAppointment, summary, formatItem, publishChange, cancelWaiting, isDuplicate } = require("../services/queueService");

const GENDERS = ["male", "female", "other", "prefer-not-to-say"];
const fail = (res, status, message) => res.status(status).json({ success: false, message });

function serverError(res, err, message) {
  console.log(err);
  return fail(res, 500, message);
}

// A queue request names a date (default: today). Returns the date, or null when it is not valid.
function dateFrom(req) {
  const date = req.query.date || todayIST();
  return isValidDate(date) ? date : null;
}

/* ================================================================== */
/* READING THE QUEUE                                                   */
/* ================================================================== */

// GET /queue/:doctorId?date=2026-10-13        (doctor or assigned receptionist)
// The full picture for a screen that has just opened or reconnected.
// `seq` is read BEFORE the data: if a change lands in between, the screen simply receives
// that change again as the next live message, which is harmless.
exports.getQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const date = dateFrom(req);
    if (!date) return fail(res, 400, "Invalid date.");

    const seq = currentSeq(roomName.queue(doctorId, date));

    const [rows, counts] = await Promise.all([
      Appointment.find({ doctor: doctorId, date })
        .populate("patient", "fullName dob gender")
        .sort({ tokenNumber: 1 })
        .lean(),
      summary(doctorId, date),
    ]);

    const withPhone = req.staff.role === "receptionist";
    return res.status(200).json({
      success: true,
      date,
      items: rows.map((row) => formatItem(row, { withPhone })),
      nowServing: counts.nowServing,
      waiting: counts.waiting,
      seq,
    });
  } catch (err) {
    return serverError(res, err, "Could not load the queue");
  }
};

// GET /queue/:doctorId/now?date=...            (any logged-in user)
// Only the two public numbers: no names, nothing private.
exports.getNowServing = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!mongoose.isValidObjectId(doctorId)) return fail(res, 404, "Doctor not found.");
    const date = dateFrom(req);
    if (!date) return fail(res, 400, "Invalid date.");

    const seq = currentSeq(roomName.now(doctorId, date));
    const { nowServing, waiting, waitingTokens } = await summary(doctorId, date);

    return res.status(200).json({ success: true, date, nowServing, waiting, waitingTokens, seq });
  } catch (err) {
    return serverError(res, err, "Could not load the queue");
  }
};

// GET /queue/:doctorId/upcoming        (doctor or assigned receptionist)
// Only counts: how many people are still waiting on each coming day (no names, nothing private).
// The days that have no one are left out.
const UPCOMING_DAYS = 30; // rescheduling can go further than the 7-day booking window
exports.getUpcoming = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = todayIST();

    const rows = await Appointment.find({
      doctor: doctorId,
      status: "waiting",
      date: { $gt: today, $lte: addDays(today, UPCOMING_DAYS) },
    })
      .select("date")
      .lean();

    const counts = {};
    for (const row of rows) counts[row.date] = (counts[row.date] || 0) + 1;

    const days = Object.keys(counts)
      .sort()
      .map((date) => ({ date, count: counts[date] }));
    return res.status(200).json({ success: true, days });
  } catch (err) {
    return serverError(res, err, "Could not load the coming days");
  }
};

/* ================================================================== */
/* CHANGING THE QUEUE  (assigned receptionist only)                    */
/* ================================================================== */

// POST /queue/:doctorId/walk-in   { name, phone, age, gender }
// For a person without the app: only these four things are kept, with no account.
exports.addWalkIn = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "");
    const age = Number(req.body.age);
    const gender = req.body.gender;

    if (name.length < 2 || name.length > 60) return fail(res, 400, "Enter the patient's name.");
    if (!/^\d{10}$/.test(phone)) return fail(res, 400, "Enter a 10-digit phone number.");
    if (!Number.isInteger(age) || age < 0 || age > 120) return fail(res, 400, "Enter a valid age.");
    if (!GENDERS.includes(gender)) return fail(res, 400, "Choose a gender.");

    const doctor = await Doctor.findById(doctorId).select("workingHours");
    if (!doctor) return fail(res, 404, "Doctor not found.");

    // Walk-ins are for today only. Refuse only when the doctor has marked today as Closed.
    const date = todayIST();
    if (!isDoctorOpenOn(doctor, date)) return fail(res, 409, "The doctor is closed today.");

    const appointment = await createAppointment({
      doctor: doctorId,
      date,
      source: "walk_in",
      walkIn: { name, phone, age, gender },
      paymentStatus: "pending",
      addedBy: req.staff.userId,
    });

    await publishChange(req.app.get("io"), appointment._id);

    return res.status(201).json({
      success: true,
      message: `${name} added with token ${appointment.tokenNumber}`,
      item: formatItem(appointment.toObject(), { withPhone: true }),
    });
  } catch (err) {
    if (err.name === "ValidationError") return fail(res, 400, err.message);
    return serverError(res, err, "Could not add the patient");
  }
};

// The allowed status changes. `from` = the only statuses the change may start from.
const CHANGES = {
  start: { from: ["waiting"], to: "in_consultation", stamp: "startedAt", todayOnly: true },
  complete: { from: ["in_consultation"], to: "completed", stamp: "completedAt" },
  cancel: { from: ["waiting"], to: "cancelled" },
  no_show: { from: ["waiting"], to: "no_show", todayOnly: true },
};

const BUSY = "Finish the current patient first.";

// POST /queue/:doctorId/next   (today)
// Calls the person with the lowest token who is still waiting.
// One atomic update; the unique "one_in_consultation" index refuses it while someone is inside.
exports.callNext = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const date = todayIST();

    const called = await Appointment.findOneAndUpdate(
      { doctor: doctorId, date, status: "waiting" },
      { status: "in_consultation", startedAt: new Date() },
      { sort: { tokenNumber: 1 }, new: true }
    );
    if (!called) return fail(res, 404, "No one is waiting.");

    await publishChange(req.app.get("io"), called._id);
    return res.status(200).json({ success: true, message: `Token ${called.tokenNumber} called` });
  } catch (err) {
    if (isDuplicate(err)) return fail(res, 409, BUSY);
    return serverError(res, err, "Could not call the next patient");
  }
};

// PUT /queue/:doctorId/appointments/:id/status   { action: "start" | "complete" | "cancel" | "no_show" }
exports.changeStatus = async (req, res) => {
  try {
    const { doctorId, id } = req.params;
    const change = CHANGES[req.body.action];

    if (!change) return fail(res, 400, "Unknown action.");
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Appointment not found.");

    const now = new Date();
    let updated;
    if (req.body.action === "cancel") {
      // a paid app booking that is cancelled here must be refunded: the same rule as the patient's own cancel
      updated = (await cancelWaiting({ _id: id, doctor: doctorId })).cancelled;
    } else {
      updated = await Appointment.findOneAndUpdate(
        {
          _id: id,
          doctor: doctorId,
          status: { $in: change.from },
          ...(change.todayOnly ? { date: todayIST() } : {}), // a patient booked for another day cannot be called or marked absent today
        },
        { status: change.to, ...(change.stamp ? { [change.stamp]: now } : {}) },
        { new: true }
      );
    }

    if (!updated) {
      // Say what is wrong instead of a general "not found"
      const exists = await Appointment.exists({ _id: id, doctor: doctorId });
      return exists
        ? fail(res, 409, "This change is not possible right now (check the patient's status and day).")
        : fail(res, 404, "Appointment not found.");
    }

    await publishChange(req.app.get("io"), updated._id);

    // A finished visit of a patient with an account goes into their Previous Consultations.
    // The visit is already saved as completed, so a failure here must not fail the request:
    // the entry is created at the next upload instead.
    if (req.body.action === "complete") {
      await ensureConsultation(updated._id).catch((err) => console.log("Could not add the consultation:", err.message));
    }

    return res.status(200).json({ success: true, item: formatItem(updated.toObject(), { withPhone: true }) });
  } catch (err) {
    if (isDuplicate(err)) return fail(res, 409, BUSY);
    return serverError(res, err, "Could not change the status");
  }
};

// PUT /queue/:doctorId/appointments/:id/fee   { paid: true | false }
// For a walk-in: the patient hands over the fee and the receptionist marks it paid (or undoes a wrong click).
// Online bookings are paid through the app, so they are not touched here.
exports.setFee = async (req, res) => {
  try {
    const { doctorId, id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Appointment not found.");
    if (typeof req.body.paid !== "boolean") return fail(res, 400, "Say whether the fee is paid.");

    const paid = req.body.paid;
    const updated = await Appointment.findOneAndUpdate(
      {
        _id: id,
        doctor: doctorId,
        source: "walk_in",
        status: { $in: ["waiting", "in_consultation", "completed"] },
        paymentStatus: paid ? "pending" : "paid",
      },
      { paymentStatus: paid ? "paid" : "pending" },
      { new: true }
    );

    if (!updated) {
      const row = await Appointment.findOne({ _id: id, doctor: doctorId }).select("source paymentStatus status").lean();
      if (!row) return fail(res, 404, "Appointment not found.");
      if (row.source !== "walk_in") return fail(res, 409, "This patient paid through the app.");
      if (!["waiting", "in_consultation", "completed"].includes(row.status)) return fail(res, 409, "This token is closed.");
      return res.status(200).json({ success: true, unchanged: true }); // already in that state (a repeated click)
    }

    await publishChange(req.app.get("io"), updated._id);
    return res.status(200).json({ success: true, item: formatItem(updated.toObject(), { withPhone: true }) });
  } catch (err) {
    return serverError(res, err, "Could not update the fee");
  }
};

// PUT /queue/:doctorId/appointments/:id/reschedule   { newDate }
// For a patient who has to do something first (for example a test) and comes back with the result.
// The current place is closed as "rescheduled" and the patient gets a NEW token on the new day.
// Same day is allowed: the patient then joins the END of today's queue.
exports.reschedule = async (req, res) => {
  const { doctorId, id } = req.params;
  const { newDate } = req.body;

  try {
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Appointment not found.");
    if (!isValidDate(newDate) || newDate < todayIST()) return fail(res, 400, "Choose today or a later date.");

    const doctor = await Doctor.findById(doctorId).select("workingHours");
    if (!doctor) return fail(res, 404, "Doctor not found.");
    if (!isDoctorOpenOn(doctor, newDate)) return fail(res, 409, "The doctor is closed on that day.");

    // 1. Close the old place. `new: false` gives back the appointment as it was.
    const before = await Appointment.findOneAndUpdate(
      { _id: id, doctor: doctorId, status: { $in: ["waiting", "in_consultation"] } },
      { status: "rescheduled" },
      { new: false }
    ).lean();
    if (!before) return fail(res, 409, "Only a waiting patient or the one inside can be rescheduled.");

    // 2. Give the same person a new token on the new day. If that fails, put the old place back.
    let fresh;
    try {
      fresh = await createAppointment({
        doctor: doctorId,
        date: newDate,
        source: before.source,
        patient: before.patient,
        walkIn: before.walkIn,
        paymentStatus: before.paymentStatus,
        paymentRef: before.paymentRef,
        addedBy: before.addedBy,
        rescheduledFrom: before._id,
      });
    } catch (err) {
      await Appointment.updateOne({ _id: before._id }, { status: before.status });
      throw err;
    }

    const io = req.app.get("io");
    await publishChange(io, before._id);
    await publishChange(io, fresh._id);

    return res.status(200).json({
      success: true,
      message: `Rescheduled to ${newDate} with token ${fresh.tokenNumber}`,
      item: formatItem(fresh.toObject(), { withPhone: true }),
    });
  } catch (err) {
    return serverError(res, err, "Could not reschedule");
  }
};
