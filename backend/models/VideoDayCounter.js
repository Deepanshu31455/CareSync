const mongoose = require("mongoose");

// The next video token number for one doctor on one day (1, 2, 3, ...), counted separately from
// the clinic's queue. One atomic update per token, so two bookings can never get the same number.
const videoDayCounterSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: String, required: true },
  lastToken: { type: Number, default: 0 },
  expireAt: { type: Date }, // removed a few days AFTER its date
});

videoDayCounterSchema.index({ doctor: 1, date: 1 }, { unique: true });
videoDayCounterSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VideoDayCounter", videoDayCounterSchema);
