const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");
const { signToken, setAuthCookie } = require("../utils/jwt");

const MODEL_BY_ROLE = {
  patient: Patient,
  doctor: Doctor,
  receptionist: Receptionist,
};

const auth = async (req, res) => {
  try {
    const { role } = req.params;
    const Model = MODEL_BY_ROLE[role];

    if (!Model) {
      return res.status(400).json({ message: "Unknown role" });
    }

    const ROLE_PREFIX = {
      patient: "1",
      receptionist: "2",
      doctor: "3",
    };

    const expectedDigit = ROLE_PREFIX[role];
    const id = String(req.body.id || "").trim();

    if (!id || !/^\d{6}$/.test(id) || !id.startsWith(expectedDigit)) {
      return res.status(400).json({
        message: `A ${role} ID must be exactly 6 digits starting with '${expectedDigit}'.`,
      });
    }

    const { emailVerified, phoneVerified } = req.body;
    if (!emailVerified || !phoneVerified) {
      // Belt-and-suspenders — the frontend already blocks this, but the
      // API shouldn't trust the client alone to enforce it.
      return res.status(400).json({ message: "Email and phone must be verified first" });
    }

    // Sanitize payload to prevent overwriting internal/protected fields
    const payload = { ...req.body, id, role };
    delete payload.rating;
    delete payload.totalRatings;
    delete payload.reviews;

    // new Model(...).save() runs the pre-save hook from
    // shared/baseUserFields.js, which hashes `password` before it's stored.
    const account = await Model.create(payload);

    // Never echo the password hash back, even though `select: false`
    // already keeps it out of normal queries.
    const { password, ...safeAccount } = account.toObject();

    // Log the user straight in — sign a token identifying this account
    // and its role, and hand it back as an httpOnly cookie so the
    // frontend never has to touch the raw token itself.
    const token = signToken({ accountId: account._id, role });
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Account created successfully",
      account: safeAccount,
      role,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key — figure out which unique field collided so the
      // error is actually useful (email, id, licenseNumber, staffCode, etc.)
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: `That ${field} is already registered` });
    }

    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0]?.message || "Invalid data";
      return res.status(400).json({ message: firstError });
    }

    console.error("registerHandler error:", err);
    return res.status(500).json({ message: "Could not create account right now" });
  }
};

module.exports = { auth };
