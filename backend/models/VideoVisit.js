const mongoose = require("mongoose");

// One video consultation of one patient with one doctor on one day.
// Video visits have their own queue, kept apart from the clinic's queue on purpose:
// the receptionist's screens and routes never read this collection, so only the doctor controls it.
//
//   waiting          booked and paid; the doctor sets a time (scheduledAt) and the patient
//                    marks themselves available (readyAt) when that time comes
//   in_consultation  the doctor started the call
//   completed        the call ended
//   cancelled | no_show
const videoVisitSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    date: { type: String, required: true }, // "2026-10-18" (Indian date)
    tokenNumber: { type: Number, required: true },

    status: {
      type: String,
      enum: ["waiting", "in_consultation", "completed", "cancelled", "no_show"],
      default: "waiting",
    },

    // The time the doctor gave this patient (a moment; shown in Indian time). Empty until the doctor sets it.
    scheduledAt: { type: Date },
    // Set when the patient says "I am available now"; cleared when they say they are not
    readyAt: { type: Date },

    // Paid through the app. "refund_pending" = cancelled after paying; the clinic returns the money.
    paymentStatus: { type: String, enum: ["paid", "refund_pending"], default: "paid" },
    paymentRef: { type: String },

    // The entry in the patient's "Previous Consultations" created by this visit
    consultationId: { type: mongoose.Schema.Types.ObjectId },

    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// The doctor's video queue for a day (the main query)
videoVisitSchema.index({ doctor: 1, date: 1, status: 1, tokenNumber: 1 });
// A token number exists once per doctor per day
videoVisitSchema.index({ doctor: 1, date: 1, tokenNumber: 1 }, { unique: true });
// A doctor can be in only ONE video call at a time (the database enforces it)
videoVisitSchema.index(
  { doctor: 1 },
  { unique: true, partialFilterExpression: { status: "in_consultation" }, name: "one_call_at_a_time" }
);
// A patient's own video visits
videoVisitSchema.index({ patient: 1, date: -1 });
videoVisitSchema.index({ paymentRef: 1 }, { sparse: true });

module.exports = mongoose.model("VideoVisit", videoVisitSchema);
