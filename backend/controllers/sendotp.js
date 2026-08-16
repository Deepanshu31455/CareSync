const nodemailer = require("nodemailer");
const Otp = require("../models/Otp"); // adjust path to wherever your model lives

const sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Remove any earlier OTP for this email first, so only the newest one is ever valid
    await Otp.findOneAndDelete({ email });
    await Otp.create({ email, otp, expiresAt });

    console.log("OTP STORED:", email, otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "MedManage OTP",
      text: `Your MedManage OTP is ${otp}`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

module.exports = { sendotp };