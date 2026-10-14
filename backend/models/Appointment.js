const mongoose = require("mongoose");

// One place in a doctor's queue on one day.
//   online    booked by a patient with a CareSync account, after paying
//   walk_in   entered by the receptionist for someone without the app: only name, phone,
//             age and gender are kept, with no account. These records are removed
//             automatically a few days after the visit (see purgeAt).
const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true }, // "2026-10-13" (Indian date)
    type: { type: String, enum: ["physical", "video"], default: "physical" },
    tokenNumber: { type: Number, required: true },

    // waiting -> in_consultation -> completed
    // waiting -> cancelled | no_show | rescheduled        in_consultation -> rescheduled
    status: {
      type: String,
      enum: ["waiting", "in_consultation", "completed", "cancelled", "no_show", "rescheduled"],
      default: "waiting",
    },

    source: { type: String, enum: ["online", "walk_in"], required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }, // online only
    walkIn: {
      name: { type: String, trim: true },
      phone: { type: String },
      age: { type: Number, min: 0, max: 120 },
      gender: { type: String, enum: ["male", "female", "other", "prefer-not-to-say"] },
    },

    // Walk-ins pay at the desk (pending until the receptionist marks it). An online booking is
    // "paid" and keeps the id of its Payment in paymentRef. When a patient cancels a paid booking
    // it becomes "refund_pending": the clinic still has to give the money back.
    paymentStatus: { type: String, enum: ["paid", "pending", "refund_pending"], default: "pending" },
    paymentRef: { type: String },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Receptionist" }, // who entered a walk-in
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },

    // The entry in the patient's "Previous Consultations" that this visit created (online patients only).
    // A patient who is rescheduled (for example to bring a test report) continues the SAME entry.
    consultationId: { type: mongoose.Schema.Types.ObjectId },

    startedAt: { type: Date },
    completedAt: { type: Date },

    // Only walk-ins have this: the whole record is deleted automatically after this moment.
    purgeAt: { type: Date },
  },
  { timestamps: true }
);

// The live queue of a doctor for a day (the main query)
appointmentSchema.index({ doctor: 1, date: 1, status: 1, tokenNumber: 1 });
// A token number exists once per doctor per day
appointmentSchema.index({ doctor: 1, date: 1, tokenNumber: 1 }, { unique: true });
// At most ONE patient can be in consultation per doctor per day. The database enforces it,
// so two receptionists pressing "Call next" together cannot both succeed.
appointmentSchema.index(
  { doctor: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: "in_consultation" }, name: "one_in_consultation" }
);
// A patient's own appointments
appointmentSchema.index({ patient: 1, date: -1 });
// Finds the booking that belongs to a payment
appointmentSchema.index({ paymentRef: 1 }, { sparse: true });
// Automatic removal of walk-in records
appointmentSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

appointmentSchema.pre("validate", function () {
  if (this.source === "online" && !this.patient) this.invalidate("patient", "An online appointment needs a patient.");
  if (this.source === "walk_in" && !(this.walkIn && this.walkIn.name && this.walkIn.phone)) {
    this.invalidate("walkIn", "A walk-in needs a name and a phone number.");
  }
});

module.exports = mongoose.model("Appointment", appointmentSchema);
