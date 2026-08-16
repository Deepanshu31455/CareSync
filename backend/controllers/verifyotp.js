const Otp = require("../models/Otp");

const verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedData = await Otp.findOne({ email });

    if (!storedData) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (Date.now() > storedData.expiresAt.getTime()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    await Otp.deleteOne({ email });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

module.exports = { verifyotp };