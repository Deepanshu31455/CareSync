const bcrypt = require("bcrypt");

const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");

const { signToken, setAuthCookie } = require("../utils/jwt");

const MODEL_BY_DIGIT = {
  "1": { Model: Patient, role: "patient" },
  "2": { Model: Receptionist, role: "receptionist" },
  "3": { Model: Doctor, role: "doctor" },
};

const login = async (req, res) => {
  try {
    const { id, password } = req.body;

    // Check that both fields were provided
    if (!id || !password) {
      return res.status(400).json({
        message: "ID and password are required",
      });
    }

    // First digit determines the role
    const firstDigit = id.charAt(0);

    const roleInfo = MODEL_BY_DIGIT[firstDigit];

    if (!roleInfo) {
      return res.status(400).json({
        message: "Invalid ID",
      });
    }

    const { Model, role } = roleInfo;

    // Find account by ID
    // Password has select:false, so explicitly include it
    const account = await Model.findOne({ id }).select("+password");

    if (!account) {
      return res.status(401).json({
        message: "Invalid ID or password",
      });
    }

    // Compare entered password with hashed password
    const passwordCorrect = await bcrypt.compare(
      password,
      account.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Invalid ID or password",
      });
    }

    // Create JWT
    const token = signToken({
      accountId: account._id,
      role,
    });

    // Store JWT in HttpOnly cookie
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
      role,
    });

  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      message: "Could not log in right now",
    });
  }
};

module.exports = { login };