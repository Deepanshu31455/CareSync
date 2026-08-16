const mongoose = require("mongoose");
const { baseUserFields, hashPassword } = require("./baseUserFields");

const doctorSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    role: { type: String, default: "doctor", immutable: true },

    // Doctor-specific, from RegisterPage_DetailsStep's doctor branch
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    experience: { type: Number, required: true, min: 0 }, // years
    affiliation: { type: String, default: "" }, // optional — clinic / hospital
  },
  { timestamps: true }
);

doctorSchema.pre("save", hashPassword);

module.exports = mongoose.model("Doctor", doctorSchema);
