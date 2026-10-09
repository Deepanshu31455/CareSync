const mongoose = require("mongoose");
const { baseUserFields, hashPassword } = require("./baseUserFields");

const doctorSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    role: { type: String, default: "doctor", immutable: true },

    // Doctor-specific fields from registration
    specialization: { type: String, required: true },
    licenseNumber:  { type: String, required: true, unique: true },
    experience:     { type: Number, required: true, min: 0 }, // years
    affiliation:    { type: String, default: "" },            // clinic / hospital name
    qualifications: { type: String, default: "" },            // e.g. "MBBS, MD, FACC"

    // Extended contact
    phone1: { type: String, default: "" }, // primary contact number
    phone2: { type: String, default: "" }, // secondary / emergency number

    // Clinic address (separate from personal address)
    clinicAddress: { type: String, default: "" },

    // Weekly schedule / hours timeline
    workingHours: [
      {
        day:      { type: String,  default: "" },
        time:     { type: String,  default: "" },
        isClosed: { type: Boolean, default: false },
      },
    ],

    // Ratings & reviews
    rating:        { type: Number, default: 0, min: 0, max: 5 },
    totalRatings:  { type: Number, default: 0 },
    reviews: [
      {
        author:         { type: String, default: "" },
        rating:         { type: Number, default: 5 },
        comment:        { type: String, default: "" },
        date:           { type: String, default: "" },
        verifiedGoogle: { type: Boolean, default: false },
      },
    ],

    // Google experience blurb
    googleExperience: { type: String, default: "" },

    // Facilities at clinic / hospital
    facilities: [{ type: String }],

    // About / other description
    otherDescription: { type: String, default: "" },

    // Navigation / directions
    directions: {
      instructions: { type: String, default: "" },
      landmark:     { type: String, default: "" },
      mapLink:      { type: String, default: "" },
    },
  },
  { timestamps: true }
);

doctorSchema.pre("save", hashPassword);

module.exports = mongoose.model("Doctor", doctorSchema);
