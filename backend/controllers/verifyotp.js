const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp");

const MAX_ATTEMPTS = 5;

const verifyotp = async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    const otp = req.body?.otp;

    if (!rawEmail || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const email = String(rawEmail).trim().toLowerCase();

    const storedData = await Otp.findOne({ email });

    if (!storedData) {
      return res.status(400).json({ message: "OTP not found. Please request a new code." });
    }

    if (Date.now() > storedData.expiresAt.getTime()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP expired. Please request a new code." });
    }

    // Lockout: if too many wrong guesses within the window, require a fresh OTP
    if (storedData.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code." });
    }

    // bcrypt.compare checks the incoming plain-text OTP against the stored hash
    const isMatch = await bcrypt.compare(String(otp).trim(), storedData.otp);
    if (!isMatch) {
      storedData.attempts += 1;
      await storedData.save();
      const remaining = MAX_ATTEMPTS - storedData.attempts;
      return res.status(400).json({
        message: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Incorrect OTP.",
      });
    }

    // Mark email as verified on server side; gives the user 15 minutes to complete registration
    storedData.verified = true;
    storedData.attempts = 0;
    storedData.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await storedData.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("verifyotp error:", error);
    return res.status(500).json({ message: "Verification failed" });
  }
};

module.exports = { verifyotp };