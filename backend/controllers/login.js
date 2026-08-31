const bcrypt = require("bcrypt");

const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");

const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/jwt");

const MODEL_BY_DIGIT = {
  "1": { Model: Patient, role: "patient" },
  "2": { Model: Receptionist, role: "receptionist" },
  "3": { Model: Doctor, role: "doctor" },
};

const login = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ message: "ID and password are required" });
    }

    const firstDigit = id.charAt(0);
    const roleInfo = MODEL_BY_DIGIT[firstDigit];

    if (!roleInfo) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const { Model, role } = roleInfo;

    // Password has select:false, so explicitly include it
    const account = await Model.findOne({ id }).select("+password");

    if (!account) {
      // Distinct message — see the note on account enumeration above.
      return res.status(401).json({ message: "ID is not registered" });
    }

    const passwordCorrect = await bcrypt.compare(password, account.password);

    if (!passwordCorrect) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = signToken({ accountId: account._id, role });
    setAuthCookie(res, token);

return res.status(200).json({
  message: "Login successful",
  id: account.id,
  name: account.fullName,
  email: account.email,
  role: account.role,
  profilePhoto:account.profilePhoto
});
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Could not log in right now" });
  }
};

const logout = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out" });
};

// Used by the navbar (and any protected page) to ask "am I logged in, and
// as whom?" — reads the cookie via requireAuth middleware, which attaches
// req.auth = { accountId, role } before this handler runs.
const me = async (req, res) => {
  try {
    const { role, accountId } = req.auth;
    const roleInfo = Object.values(MODEL_BY_DIGIT).find((r) => r.role === role);
    if (!roleInfo) return res.status(401).json({ message: "Invalid session" });

    const account = await roleInfo.Model.findById(accountId).select("fullName id role");
    if (!account) return res.status(401).json({ message: "Account no longer exists" });

    return res.status(200).json({
      fullName: account.fullName,
      id: account.id,
      role,
    });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Could not fetch account" });
  }
};

module.exports = { login, logout, me };
