const mongoose = require("mongoose");

const VideoVisit = require("../models/VideoVisit");
const Doctor = require("../models/Doctor");
const Payment = require("../models/Payment");
const { todayIST, isValidDate, isDoctorOpenOn, addDays, istMoment, clockOf } = require("../utils/dates");
const { ACTIVE, EARLY_MINUTES, createVideoVisit, publishVideoChange, cancelVideoWaiting } = require("../services/videoService");
const { isDuplicate } = require("../services/queueService");
const { BOOKING_WINDOW_DAYS } = require("./doctorSearchController");
const { paymentMode, findDoctor, doctorCard, PAYMENT_MINUTES, CLAIM_SECONDS } = require("./bookingController");

// The patient's side of video visits. Booking works like a clinic booking (checkout, pay, token):
//   POST /patient/video/checkout                 { doctorId (6-digit), date }
//   POST /patient/video/:paymentId/confirm
//   GET  /patient/video-visits                   my coming video visits
//   POST /patient/video-visits/:id/available     { available: true | false }
//   POST /patient/video-visits/:id/cancel
// The fee is the doctor's normal consultation fee.

const fail = (res, status, message) => res.status(status).json({ success: false, message });

function serverError(res, err, message) {
  console.log(err);
  return fail(res, 500, message);
}

// Why this doctor cannot be booked for video on this day, or null when it is fine.
// A video visit needs a day the doctor works. The closing time does not stop it: the doctor gives each patient a time.
function whyNot(doctor, date) {
  if (!isValidDate(date)) return "Choose a valid day.";
  const today = todayIST();
  if (date < today || date > addDays(today, BOOKING_WINDOW_DAYS)) {
    return `You can book from today up to ${BOOKING_WINDOW_DAYS} days ahead.`;
  }
  if (!isDoctorOpenOn(doctor, date, { strict: true })) return "The doctor is not consulting on that day.";
  return null;
}

const hasActiveVisit = (patientId, doctorId, date) =>
  VideoVisit.exists({ patient: patientId, doctor: doctorId, date, status: { $in: ACTIVE } });

// One open payment per patient, doctor and day (the database allows only one, of either kind).
// An unfinished payment for the clinic visit is replaced: the patient changed their mind.
async function openPayment(patientId, doctor, date) {
  await Payment.deleteOne({ patient: patientId, doctor: doctor._id, date, status: "created", type: { $ne: "video" } });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await Payment.findOneAndUpdate(
        { patient: patientId, doctor: doctor._id, date, status: "created", type: "video" },
        {
          $set: { amount: doctor.consultationFee || 0, expiresAt: new Date(Date.now() + PAYMENT_MINUTES * 60 * 1000) },
          $setOnInsert: { provider: "demo" },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (!isDuplicate(err) || attempt === 2) throw err;
    }
  }
}

// The visit as the patient's screen shows it
async function visitView(visit, doctor) {
  const ahead =
    visit.status === "waiting"
      ? await VideoVisit.countDocuments({
          doctor: visit.doctor._id || visit.doctor,
          date: visit.date,
          status: "waiting",
          tokenNumber: { $lt: visit.tokenNumber },
        })
      : 0;

  const scheduled = visit.scheduledAt ? new Date(visit.scheduledAt) : null;
  return {
    visitId: String(visit._id),
    date: visit.date,
    tokenNumber: visit.tokenNumber,
    status: visit.status,
    type: "video",
    paymentStatus: visit.paymentStatus,
    scheduledAt: scheduled ? scheduled.toISOString() : null,
    // from when the patient may mark themselves available (the browser compares it with its own clock)
    availableFrom: scheduled ? new Date(scheduled.getTime() - EARLY_MINUTES * 60 * 1000).toISOString() : null,
    ready: Boolean(visit.readyAt),
    peopleAhead: ahead,
    doctor: doctorCard(doctor),
  };
}

/* 1. POST /patient/video/checkout   { doctorId, date } */
exports.checkout = async (req, res) => {
  try {
    const { doctorId, date } = req.body;

    const doctor = await findDoctor(doctorId);
    if (!doctor) return fail(res, 404, "Doctor not found.");

    const problem = whyNot(doctor, date);
    if (problem) return fail(res, 400, problem);

    if (await hasActiveVisit(req.patient._id, doctor._id, date)) {
      return fail(res, 409, "You already have a video visit with this doctor on that day.");
    }

    const payment = await openPayment(req.patient._id, doctor, date);

    return res.status(200).json({
      success: true,
      mode: paymentMode(),
      payment: {
        id: String(payment._id),
        amount: payment.amount,
        currency: payment.currency,
        expiresAt: payment.expiresAt,
        date: payment.date,
        doctor: doctorCard(doctor),
      },
    });
  } catch (err) {
    return serverError(res, err, "Could not start the booking");
  }
};

/* 2. POST /patient/video/:paymentId/confirm: marks the payment paid and gives the token. Safe to repeat. */
exports.confirm = async (req, res) => {
  try {
    if (paymentMode() !== "demo") return fail(res, 501, "Online payment is not set up yet.");

    const { paymentId } = req.params;
    const patientId = req.patient._id;
    if (!mongoose.isValidObjectId(paymentId)) return fail(res, 404, "Payment not found.");

    let payment = await Payment.findOne({ _id: paymentId, patient: patientId, type: "video" });
    if (!payment) return fail(res, 404, "Payment not found.");

    // A. Not paid yet: check the booking is still possible, then mark it paid (one atomic change)
    if (payment.status === "created") {
      if (payment.expiresAt.getTime() < Date.now()) return fail(res, 410, "This payment session expired. Please start again.");

      const doctor = await Doctor.findById(payment.doctor).select("workingHours").lean();
      const problem = doctor ? whyNot(doctor, payment.date) : "Doctor not found.";
      if (problem) return fail(res, 409, problem);

      if (await hasActiveVisit(patientId, payment.doctor, payment.date)) {
        return fail(res, 409, "You already have a video visit with this doctor on that day.");
      }

      const now = new Date();
      payment =
        (await Payment.findOneAndUpdate(
          { _id: paymentId, patient: patientId, type: "video", status: "created", expiresAt: { $gt: now } },
          { status: "paid", paidAt: now },
          { new: true }
        )) || (await Payment.findOne({ _id: paymentId, patient: patientId, type: "video" }));
    }

    if (payment.status !== "paid") return fail(res, 409, "This payment cannot be used for a booking.");

    const doctor = await Doctor.findById(payment.doctor).select("id fullName specialization profilePhoto clinicAddress").lean();
    if (!doctor) return fail(res, 404, "Doctor not found.");

    // B. Already booked (a repeated request)? Return that visit.
    if (payment.appointment) {
      const existing = await VideoVisit.findById(payment.appointment).lean();
      if (existing) return res.status(200).json({ success: true, booking: await visitView(existing, doctor) });
    }

    // C. Create the visit. Only ONE request at a time may do this (the claim).
    const staleBefore = new Date(Date.now() - CLAIM_SECONDS * 1000);
    const claimed = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        status: "paid",
        appointment: { $exists: false },
        $or: [{ claimedAt: { $exists: false } }, { claimedAt: { $lt: staleBefore } }],
      },
      { claimedAt: new Date() },
      { new: true }
    );
    if (!claimed) return fail(res, 409, "Your booking is being confirmed. Check \"My video visits\" in a moment.");

    let visit;
    try {
      visit =
        (await VideoVisit.findOne({ paymentRef: String(payment._id) })) ||
        (await createVideoVisit({ doctor: payment.doctor, patient: patientId, date: payment.date, paymentRef: String(payment._id) }));
      await Payment.updateOne({ _id: paymentId }, { appointment: visit._id, $unset: { claimedAt: 1 } });
    } catch (err) {
      await Payment.updateOne({ _id: paymentId }, { $unset: { claimedAt: 1 } });
      throw err;
    }

    publishVideoChange(req.app.get("io"), visit);

    const plain = visit.toObject ? visit.toObject() : visit;
    return res.status(201).json({
      success: true,
      message: `Booked. Your video token is ${plain.tokenNumber}. The doctor will set your time.`,
      booking: await visitView(plain, doctor),
    });
  } catch (err) {
    return serverError(res, err, "Could not confirm the booking");
  }
};

/* 3. GET /patient/video-visits: today's and coming visits that are still open, soonest first */
exports.myVisits = async (req, res) => {
  try {
    const rows = await VideoVisit.find({
      patient: req.patient._id,
      date: { $gte: todayIST() },
      status: { $in: ACTIVE },
    })
      .populate("doctor", "id fullName specialization profilePhoto clinicAddress")
      .sort({ date: 1, tokenNumber: 1 })
      .limit(20)
      .lean();

    const visits = [];
    for (const row of rows) {
      if (row.doctor) visits.push(await visitView(row, row.doctor));
    }
    return res.status(200).json({ success: true, visits });
  } catch (err) {
    return serverError(res, err, "Could not load your video visits");
  }
};

/* 4. POST /patient/video-visits/:id/available   { available: true | false }
   "I am available now" (the doctor sees it) or take it back. */
exports.setAvailable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Video visit not found.");
    if (typeof req.body.available !== "boolean") return fail(res, 400, "Say whether you are available.");

    const visit = await VideoVisit.findOne({ _id: id, patient: req.patient._id }).lean();
    if (!visit) return fail(res, 404, "Video visit not found.");
    if (visit.status !== "waiting") return fail(res, 409, "This visit is no longer waiting.");

    if (req.body.available) {
      if (visit.date !== todayIST()) return fail(res, 409, "You can mark yourself available on the day of your visit.");
      if (!visit.scheduledAt) return fail(res, 409, "The doctor has not set your time yet.");

      const from = new Date(new Date(visit.scheduledAt).getTime() - EARLY_MINUTES * 60 * 1000);
      if (Date.now() < from.getTime()) {
        return fail(res, 409, `You can mark yourself available from ${clockOf(from)} (Indian time).`);
      }
    }

    const update = req.body.available ? { readyAt: new Date() } : { $unset: { readyAt: 1 } };
    const updated = await VideoVisit.findOneAndUpdate({ _id: id, patient: req.patient._id, status: "waiting" }, update, { new: true });
    if (!updated) return fail(res, 409, "This visit is no longer waiting.");

    publishVideoChange(req.app.get("io"), updated);
    return res.status(200).json({ success: true, ready: Boolean(updated.readyAt) });
  } catch (err) {
    return serverError(res, err, "Could not update your availability");
  }
};

/* 5. POST /patient/video-visits/:id/cancel: only while waiting; a paid visit is flagged for a refund */
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Video visit not found.");

    const { cancelled } = await cancelVideoWaiting({ _id: id, patient: req.patient._id });
    if (!cancelled) return fail(res, 409, "Only a visit that is still waiting can be cancelled.");

    publishVideoChange(req.app.get("io"), cancelled);
    return res.status(200).json({
      success: true,
      message: "Video visit cancelled. Your refund has been requested; the clinic will return the amount.",
    });
  } catch (err) {
    return serverError(res, err, "Could not cancel the visit");
  }
};
