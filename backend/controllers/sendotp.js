const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp");
const { sendMail } = require("../utils/sendMail");

const sendotp = async (req, res) => {
  try {
    const rawEmail = req.body?.email;
    if (!rawEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const email = String(rawEmail).trim().toLowerCase();

    // crypto.randomInt is a CSPRNG — far more unpredictable than Math.random()
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute validity

    // Hash before saving — even a DB dump won't expose the live OTP
    const otpHash = await bcrypt.hash(otp, 10);

    // Remove any previous OTPs for this email before inserting a fresh one
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpHash, expiresAt, verified: false, attempts: 0 });

    console.log(`[CareSync OTP] Verification code for ${email}: ${otp}`);

    // Send email via Nodemailer
    await sendMail({
      to: email,
      subject: "CareSync Verification OTP",
      text: `Your CareSync verification OTP is ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #1e293b;">
          <h2 style="color: #0f766e;">CareSync Verification</h2>
          <p>Your one-time verification code is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0d9488; margin: 16px 0;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #64748b;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("sendotp error:", error);
    return res.status(500).json({
      message: error.message ? `Email error: ${error.message}` : "Failed to send OTP",
    });
  }
};

module.exports = { sendotp };