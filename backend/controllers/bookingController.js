const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Payment = require("../models/Payment");
const { access } = require("../socket/identity");
const { todayIST, isValidDate, isDoctorOpenOn, isDoctorBookableOn, addDays } = require("../utils/dates");
const { createAppointment, publishChange, cancelWaiting, isDuplicate } = require("../services/queueService");
const { BOOKING_WINDOW_DAYS } = require("./doctorSearchController");

// A patient books like this (every step is a separate request):
//   1. POST /patient/bookings/checkout          { doctorId (6-digit), date }   -> a payment to pay
//   2. POST /patient/bookings/:paymentId/confirm                                -> paid + token number
//   3. GET  /patient/bookings                   my upcoming bookings
//   4. POST /patient/bookings/:appointmentId/cancel
//
// PAYMENTS ARE "DEMO" FOR NOW: PAYMENT_MODE defaults to "demo", where step 2 simply marks the
// payment as paid (no money moves). To use a real gateway (for example Razorpay), only step 2
// changes: it must be called after the gateway's signature is verified. Everything around it stays.

const PAYMENT_MINUTES = 15; // how long a started payment stays valid
const CLAIM_SECONDS = 30; // how long one request may hold the "creating the booking" claim
const ACTIVE = ["waiting", "in_consultation"];

const fail = (res, status, message) => res.status(status).json({ success: false, message });
// "demo" = nobody is charged (one-click payment). Kept as demo so booking is never blocked.
const paymentMode = () => process.env.PAYMENT_MODE || "demo";

function serverError(res, err, message) {
  console.log(err);
  return fail(res, 500, message);
}

// Why this doctor cannot be booked on this day, or null when it is fine
function whyNot(doctor, date) {
  if (!isValidDate(date)) return "Choose a valid day.";
  const today = todayIST();
  if (date < today || date > addDays(today, BOOKING_WINDOW_DAYS)) {
    return `You can book from today up to ${BOOKING_WINDOW_DAYS} days ahead.`;
  }
  if (!isDoctorOpenOn(doctor, date, { strict: true })) return "The doctor is not consulting on that day.";
  if (!isDoctorBookableOn(doctor, date)) return "The doctor's hours for today are over. Choose another day.";
  return null;
}

// The doctor by 6-digit ID (the database id is accepted too), only if verified
async function findDoctor(ref) {
  const id = await access.resolveDoctorId(ref);
  if (!id) return null;
  return Doctor.findOne({ _id: id, emailVerified: true })
    .select("id fullName specialization profilePhoto clinicAddress consultationFee workingHours")
    .lean();
}

const doctorCard = (doctor) => ({
  id: doctor.id,
  fullName: doctor.fullName,
  specialization: doctor.specialization,
  profilePhoto: doctor.profilePhoto,
  clinicAddress: doctor.clinicAddress,
});

const hasActiveBooking = (patientId, doctorId, date) =>
  Appointment.exists({ patient: patientId, doctor: doctorId, date, status: { $in: ACTIVE } });

// The open payment for this patient, doctor and day (created, or refreshed when it already exists).
// The unique index "one_open_payment" makes two parallel requests end up with the same payment.
async function openPayment(patientId, doctor, date) {
  // an unfinished payment for a video visit is replaced (the database allows one open payment per day)
  await Payment.deleteOne({ patient: patientId, doctor: doctor._id, date, status: "created", type: "video" });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await Payment.findOneAndUpdate(
        { patient: patientId, doctor: doctor._id, date, status: "created" },
        {
          $set: {
            amount: doctor.consultationFee || 0,
            type: "physical",
            expiresAt: new Date(Date.now() + PAYMENT_MINUTES * 60 * 1000),
          },
          $setOnInsert: { provider: "demo" },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (!isDuplicate(err) || attempt === 2) throw err;
    }
  }
}

// The booking as the screen shows it
async function bookingView(appointment, doctor) {
  const ahead =
    appointment.status === "waiting"
      ? await Appointment.countDocuments({
          doctor: appointment.doctor,
          date: appointment.date,
          status: "waiting",
          tokenNumber: { $lt: appointment.tokenNumber },
        })
      : 0;

  return {
    appointmentId: String(appointment._id),
    date: appointment.date,
    tokenNumber: appointment.tokenNumber,
    status: appointment.status,
    type: appointment.type,
    paymentStatus: appointment.paymentStatus,
    peopleAhead: ahead,
    doctor: doctorCard(doctor),
  };
}

/* ------------------------------------------------------------------ */
/* 1. POST /patient/bookings/checkout   { doctorId, date, type? }      */
/* ------------------------------------------------------------------ */
exports.checkout = async (req, res) => {
  try {
    const { doctorId, date, type = "physical" } = req.body;

    if (type !== "physical") return fail(res, 400, "Only physical consultations can be booked for now.");

    const doctor = await findDoctor(doctorId);
    if (!doctor) return fail(res, 404, "Doctor not found.");

    const problem = whyNot(doctor, date);
    if (problem) return fail(res, 400, problem);

    if (await hasActiveBooking(req.patient._id, doctor._id, date)) {
      return fail(res, 409, "You already have a booking with this doctor on that day.");
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

/* ------------------------------------------------------------------ */
/* 2. POST /patient/bookings/:paymentId/confirm                        */
/* Marks the payment paid and gives the patient a token. Safe to call  */
/* again: the same booking is returned, never a second one.            */
/* ------------------------------------------------------------------ */
exports.confirm = async (req, res) => {
  try {
    if (paymentMode() !== "demo") return fail(res, 501, "Online payment is not set up yet.");

    const { paymentId } = req.params;
    const patientId = req.patient._id;
    if (!mongoose.isValidObjectId(paymentId)) return fail(res, 404, "Payment not found.");

    let payment = await Payment.findOne({ _id: paymentId, patient: patientId, type: { $ne: "video" } });
    if (!payment) return fail(res, 404, "Payment not found.");

    // A. Not paid yet: check the booking is still possible, then mark it paid (one atomic change)
    if (payment.status === "created") {
      if (payment.expiresAt.getTime() < Date.now()) return fail(res, 410, "This payment session expired. Please start again.");

      const doctor = await Doctor.findById(payment.doctor).select("workingHours").lean();
      const problem = doctor ? whyNot(doctor, payment.date) : "Doctor not found.";
      if (problem) return fail(res, 409, problem);

      if (await hasActiveBooking(patientId, payment.doctor, payment.date)) {
        return fail(res, 409, "You already have a booking with this doctor on that day.");
      }

      const now = new Date();
      payment =
        (await Payment.findOneAndUpdate(
          { _id: paymentId, patient: patientId, status: "created", expiresAt: { $gt: now } },
          { status: "paid", paidAt: now },
          { new: true }
        )) || (await Payment.findOne({ _id: paymentId, patient: patientId })); // a parallel request may have won
    }

    if (payment.status !== "paid") return fail(res, 409, "This payment cannot be used for a booking.");

    const doctor = await findDoctorById(payment.doctor);
    if (!doctor) return fail(res, 404, "Doctor not found.");

    // B. Already booked (a repeated request)? Return that booking.
    if (payment.appointment) {
      const existing = await Appointment.findById(payment.appointment).lean();
      if (existing) return res.status(200).json({ success: true, booking: await bookingView(existing, doctor) });
    }

    // C. Create the appointment. Only ONE request at a time may do this (the claim).
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
    if (!claimed) {
      return fail(res, 409, "Your booking is being confirmed. Check \"My bookings\" in a moment.");
    }

    let appointment;
    try {
      // an interrupted earlier try may already have created it
      appointment =
        (await Appointment.findOne({ paymentRef: String(payment._id), rescheduledFrom: { $exists: false } })) ||
        (await createAppointment({
          doctor: payment.doctor,
          date: payment.date,
          type: "physical",
          source: "online",
          patient: patientId,
          paymentStatus: "paid",
          paymentRef: String(payment._id),
        }));
      await Payment.updateOne({ _id: paymentId }, { appointment: appointment._id, $unset: { claimedAt: 1 } });
    } catch (err) {
      await Payment.updateOne({ _id: paymentId }, { $unset: { claimedAt: 1 } }); // let the next try go ahead
      throw err;
    }

    await publishChange(req.app.get("io"), appointment._id);

    const plain = appointment.toObject ? appointment.toObject() : appointment;
    return res.status(201).json({
      success: true,
      message: `Booked. Your token number is ${plain.tokenNumber}.`,
      booking: await bookingView(plain, doctor),
    });
  } catch (err) {
    return serverError(res, err, "Could not confirm the booking");
  }
};

async function findDoctorById(id) {
  return Doctor.findById(id).select("id fullName specialization profilePhoto clinicAddress").lean();
}

/* ------------------------------------------------------------------ */
/* 3. GET /patient/bookings                                            */
/* Today's and future bookings that are still waiting or with the      */
/* doctor, soonest first.                                              */
/* ------------------------------------------------------------------ */
exports.myBookings = async (req, res) => {
  try {
    const rows = await Appointment.find({
      patient: req.patient._id,
      date: { $gte: todayIST() },
      status: { $in: ACTIVE },
    })
      .populate("doctor", "id fullName specialization profilePhoto clinicAddress")
      .sort({ date: 1, tokenNumber: 1 })
      .limit(20)
      .lean();

    const bookings = rows
      .filter((row) => row.doctor)
      .map((row) => ({
        appointmentId: String(row._id),
        date: row.date,
        tokenNumber: row.tokenNumber,
        status: row.status,
        type: row.type,
        paymentStatus: row.paymentStatus,
        doctor: doctorCard(row.doctor),
      }));

    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return serverError(res, err, "Could not load your bookings");
  }
};

/* ------------------------------------------------------------------ */
/* 4. POST /patient/bookings/:appointmentId/cancel                     */
/* Only while still waiting. A paid booking becomes "refund pending"   */
/* (the clinic returns the money; automatic refunds come with the      */
/* payment gateway).                                                   */
/* ------------------------------------------------------------------ */
exports.cancelBooking = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!mongoose.isValidObjectId(appointmentId)) return fail(res, 404, "Booking not found.");

    const { cancelled, refund } = await cancelWaiting({ _id: appointmentId, patient: req.patient._id });

    if (!cancelled) {
      return fail(res, 409, "Only a booking that is still waiting can be cancelled. If you are with the doctor, ask the receptionist.");
    }

    await publishChange(req.app.get("io"), cancelled._id);

    return res.status(200).json({
      success: true,
      message: refund
        ? "Booking cancelled. Your refund has been requested; the clinic will return the amount."
        : "Booking cancelled.",
    });
  } catch (err) {
    return serverError(res, err, "Could not cancel the booking");
  }
};

// Shared with the video booking (videoBookingController)
Object.assign(exports, { paymentMode, findDoctor, doctorCard, PAYMENT_MINUTES, CLAIM_SECONDS });
