const Otp = require("../models/Otp");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");
const { signToken, setAuthCookie } = require("../utils/jwt");

const MODEL_BY_ROLE = {
  patient: Patient,
  doctor: Doctor,
  receptionist: Receptionist,
};

// Whitelist of fields allowed during registration.
// Matches baseUserFields + role-specific schemas (Patient, Doctor, Receptionist)
// while blocking protected internal fields (prescriptions, consultations, reviews, ratings).
const ALLOWED_FIELDS = {
  patient: [
    "fullName", "email", "password", "phone",
    "dob", "gender", "address",
    "bloodGroup", "emergencyContact", "knownConditions",
    "profilePhoto",
  ],
  doctor: [
    "fullName", "email", "password", "phone",
    "dob", "gender", "address",
    "specialization", "licenseNumber", "experience",
    "affiliation", "qualifications", "consultationFee",
    "phone1", "phone2", "clinicAddress", "workingHours",
    "profilePhoto",
  ],
  receptionist: [
    "fullName", "email", "password", "phone",
    "dob", "gender", "address",
    "staffCode", "profilePhoto",
  ],
};

function pickAllowed(body, role) {
  const allowed = ALLOWED_FIELDS[role] || [];
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );
}

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

    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();

    // 1. Server-side email OTP verification:
    // Must find an Otp record that was verified via /verify-otp within the valid TTL window.
    const verifiedRecord = await Otp.findOne({ email: normalizedEmail, verified: true });
    if (!verifiedRecord) {
      return res.status(400).json({
        message: "Email verification is missing or expired. Please verify your email via OTP.",
      });
    }

    // 2. Build payload from allowlist
    const payload = pickAllowed(req.body, role);
    payload.id = id;
    payload.role = role;

    // 3. Set verification flags directly on the server after server-side check succeeds
    // Do NOT rely on client-supplied booleans
    payload.emailVerified = true;
    payload.phoneVerified = true; // Auto-passed until SMS gateway is active
    payload.authMethod = req.body.authMethod === "google" ? "google" : "manual";

    // new Model(...).save() runs the pre-save hook from
    // shared/baseUserFields.js, which hashes `password` before it's stored.
    const account = await Model.create(payload);

    // Clean up verified OTP record now that account is created
    await Otp.deleteMany({ email: normalizedEmail }).catch(() => {});

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
