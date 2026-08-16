const mongoose = require("mongoose");
const { baseUserFields, hashPassword } = require("./baseUserFields");

const patientSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    role: { type: String, default: "patient", immutable: true },

    // Patient-specific, from RegisterPage_DetailsStep's patient branch
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    emergencyContact: { type: String, required: true },
    knownConditions: { type: String, default: "" }, // optional — allergies / existing conditions
  },
  { timestamps: true }
);

patientSchema.pre("save", hashPassword);

module.exports = mongoose.model("Patient", patientSchema);
