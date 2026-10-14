const mongoose = require("mongoose");

// The money side of ONE online booking.
//   created          the patient pressed "Book"; waiting for the payment (valid for a few minutes)
//   paid             the money arrived; the booking (appointment) is created from it
//   refund_pending   the booking was cancelled after payment; the clinic still has to refund
//   refunded         the refund was done (set by the clinic)
// While payments are "demo" (see bookingController), nothing real is charged.
const paymentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true }, // the consultation day, "2026-10-13"
    type: { type: String, enum: ["physical", "video"], default: "physical" },

    amount: { type: Number, required: true, min: 0 }, // rupees, the doctor's fee when the payment was created
    currency: { type: String, default: "INR" },
    provider: { type: String, default: "demo" }, // later: "razorpay"
    providerRef: { type: String }, // the gateway's own payment id, once there is a gateway

    status: { type: String, enum: ["created", "paid", "refund_pending", "refunded"], default: "created" },
    expiresAt: { type: Date, required: true },
    paidAt: { type: Date },

    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    claimedAt: { type: Date }, // set while one request is creating the appointment (stops a double booking)
  },
  { timestamps: true }
);

// One open payment per patient, doctor and day: pressing "Book" twice reuses it
paymentSchema.index(
  { patient: 1, doctor: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: "created" }, name: "one_open_payment" }
);
paymentSchema.index({ patient: 1, createdAt: -1 });
paymentSchema.index({ appointment: 1 }, { sparse: true });

module.exports = mongoose.model("Payment", paymentSchema);
