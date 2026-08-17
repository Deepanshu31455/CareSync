const mongoose = require("mongoose");
const { baseUserFields, hashPassword } = require("./baseUserFields");

const receptionistSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    role: { type: String, default: "receptionist", immutable: true },

    // Receptionist-specific — note this role skips the "details" step
    // in the registration wizard, so these come from wherever you end
    // up collecting them (e.g. added by a clinic admin, not self-registration)
    // branch: { type: String, required: true }, // assigned clinic branch
    // shift: { type: String, enum: ["morning", "evening", "night"], required: true },
    // staffCode: { type: String, required: true, unique: true }, // assigned by clinic admin
  },
  { timestamps: true }
);

receptionistSchema.pre("save", hashPassword);

module.exports = mongoose.model("Receptionist", receptionistSchema);
