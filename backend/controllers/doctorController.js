const Doctor = require("../models/Doctor");

// ─── GET /api/v1/doctor/profile ──────────────────────────────────────────────
// Returns the full profile of the currently-logged-in doctor (from JWT cookie).
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.accountId).select("-password");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    return res.status(200).json({ success: true, doctor });
  } catch (err) {
    console.error("getDoctorProfile error:", err);
    return res.status(500).json({ success: false, message: "Could not fetch doctor profile." });
  }
};

// ─── PUT /api/v1/doctor/profile ──────────────────────────────────────────────
// Updates the editable profile fields. Only the logged-in doctor can update
// their own profile. Fields that are not sent are left unchanged.
exports.updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.accountId);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    // List of every field a doctor is allowed to update from the profile page.
    const updatable = [
      "fullName",
      "specialization",
      "qualifications",
      "affiliation",
      "experience",
      "phone",
      "phone1",
      "phone2",
      "address",
      "clinicAddress",
      "workingHours",
      "rating",
      "totalRatings",
      "reviews",
      "googleExperience",
      "facilities",
      "otherDescription",
      "directions",
      "profilePhoto",
    ];

    updatable.forEach((key) => {
      if (req.body[key] !== undefined) {
        doctor[key] = req.body[key];
      }
    });

    await doctor.save();

    const updated = await Doctor.findById(doctor._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      doctor: updated,
    });
  } catch (err) {
    console.error("updateDoctorProfile error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0]?.message || "Validation error";
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: "Could not update doctor profile." });
  }
};

