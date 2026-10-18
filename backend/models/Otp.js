const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, trim: true },
  otp:       { type: String, required: true }, // stored as bcrypt hash
  expiresAt: { type: Date,   required: true },
  verified:  { type: Boolean, default: false },
  attempts:  { type: Number,  default: 0 },     // track failed guesses; max 5
});

// Automatically remove expired documents from MongoDB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);