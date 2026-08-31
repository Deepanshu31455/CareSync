const bcrypt = require("bcrypt");

// Fields every role collects in the "Personal details" + "Account setup"
// steps of registration — factored out so Patient/Doctor/Receptionist
// don't each redefine them slightly differently.
const baseUserFields = {
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer-not-to-say"],
    required: true,
  },
  address: { type: String, required: true },

  // The full login ID shown in the UI as a locked role-digit + 5 typed
  // digits (e.g. "175758" for a patient) — stored as the single string,
  // not split back into digit/suffix.
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // never returned by default queries

  authMethod: { type: String, enum: ["google", "manual"], default: "manual" },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  profilePhoto: { type: String, default: ""},
};

// Hashes `password` before save, only when it's new or has changed —
// attach this to every role schema with `schema.pre("save", hashPassword)`.
async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
}

module.exports = { baseUserFields, hashPassword };
