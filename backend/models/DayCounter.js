const mongoose = require("mongoose");

// Hands out the next token number for one doctor on one day (1, 2, 3, ...).
// One small document per doctor per day. The number goes up in a single atomic
// update, so two people booking at the same moment can never get the same token.
const dayCounterSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: String, required: true }, // "2026-10-13"
  lastToken: { type: Number, default: 0 },
  // removed a few days AFTER its date, never before (a booking for a future day must keep its counter)
  expireAt: { type: Date },
});

dayCounterSchema.index({ doctor: 1, date: 1 }, { unique: true });
dayCounterSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("DayCounter", dayCounterSchema);
