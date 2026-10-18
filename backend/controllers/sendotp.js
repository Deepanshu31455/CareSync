const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp");

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

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"CareSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CareSync Verification OTP",
      text: `Your CareSync verification OTP is ${otp}. It is valid for 5 minutes.`,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("sendotp error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

module.exports = { sendotp };