const fs = require("fs/promises");
const cloudinary = require("cloudinary").v2;
const Doctor = require("../models/Doctor");

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

// Every field a doctor may change from the profile page.
// rating, totalRatings and reviews are deliberately NOT here: a doctor must not be
// able to write their own ratings. (The page shows sample ratings for now.)
const UPDATABLE_FIELDS = [
  "fullName",
  "specialization",
  "qualifications",
  "affiliation",
  "experience",
  "consultationFee",
  "phone",
  "phone1",
  "phone2",
  "address",
  "clinicAddress",
  "workingHours",
  "googleExperience",
  "facilities",
  "otherDescription",
  "directions",
  "profilePhoto",
];

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

    UPDATABLE_FIELDS.forEach((key) => {
      if (req.body[key] !== undefined) {
        doctor[key] = req.body[key];
      }
    });

    await doctor.save(); // runs the schema validators (for example consultationFee >= 0)

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

// ─── PUT /api/v1/doctor/photo ──────────────────────────────────────────────
// Uploads a profile photo to Cloudinary and saves the URL on the doctor.
exports.updatePhoto = async (req, res) => {
  const file = req.files?.imageFile || req.files?.image || req.files?.photo;
  try {
    if (!file) {
      return res.status(400).json({ success: false, message: "Please choose an image." });
    }
    if (!PHOTO_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ success: false, message: "Only JPG, PNG, or WebP images are allowed." });
    }
    if (file.size > MAX_PHOTO_SIZE) {
      return res.status(400).json({ success: false, message: "The image must be smaller than 5 MB." });
    }

    let uploaded;
    if (file.tempFilePath) {
      uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "Deep",
        resource_type: "image",
      });
      fs.unlink(file.tempFilePath).catch(() => {});
    } else if (file.data && Buffer.isBuffer(file.data)) {
      const base64Data = `data:${file.mimetype || "image/jpeg"};base64,${file.data.toString("base64")}`;
      uploaded = await cloudinary.uploader.upload(base64Data, {
        folder: "Deep",
        resource_type: "image",
      });
    } else {
      return res.status(400).json({ success: false, message: "No image file data found to upload." });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.accountId,
      { profilePhoto: uploaded.secure_url },
      { new: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    return res.status(200).json({
      success: true,
      profilePhoto: uploaded.secure_url,
      doctor,
      message: "Profile photo updated successfully",
    });
  } catch (err) {
    if (file?.tempFilePath) {
      fs.unlink(file.tempFilePath).catch(() => {});
    }
    console.error("Doctor photo update error:", err);
    return res.status(500).json({ success: false, message: err.message || "Could not update profile photo" });
  }
};
