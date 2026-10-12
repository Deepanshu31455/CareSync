const cloudinary = require("cloudinary").v2;

const Receptionist = require("../models/Receptionist");

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

// The only fields a receptionist may change.
// Receptionist ID, email, role and password are NOT here, so they can never be edited.
const EDITABLE_FIELDS = ["fullName", "phone", "dob", "gender", "address"];

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const PHOTO_TYPES = ["image/jpeg", "image/png"];

function sendError(res, err, fallback) {
  console.log(err);
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: fallback });
}

/* ------------------------------------------------------------------ */
/* GET /receptionist/profile                                           */
/* ------------------------------------------------------------------ */
exports.getProfile = async (req, res) => {
  // req.account was loaded by loadReceptionist from the login token.
  // The password is never returned (select: false in the schema).
  return res.status(200).json({ success: true, receptionist: req.account });
};

/* ------------------------------------------------------------------ */
/* PUT /receptionist/profile                                           */
/* ------------------------------------------------------------------ */
exports.updateProfile = async (req, res) => {
  try {
    // Copy only the allowed fields, ignore everything else in the request
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (updates.phone !== undefined && !/^\d{10}$/.test(updates.phone)) {
      return res.status(400).json({ success: false, message: "Enter a 10-digit phone number" });
    }

    const receptionist = await Receptionist.findByIdAndUpdate(req.account._id, updates, {
      new: true,
      runValidators: true,
    });

    return res
      .status(200)
      .json({ success: true, receptionist, message: "Profile updated successfully" });
  } catch (err) {
    return sendError(res, err, "Could not update your profile");
  }
};

/* ------------------------------------------------------------------ */
/* PUT /receptionist/photo   (form field: imageFile)                   */
/* ------------------------------------------------------------------ */
exports.updatePhoto = async (req, res) => {
  try {
    const file = req.files?.imageFile;
    if (!file) {
      return res.status(400).json({ success: false, message: "Please choose an image." });
    }
    if (!PHOTO_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ success: false, message: "Only JPG or PNG images are allowed." });
    }
    if (file.size > MAX_PHOTO_SIZE) {
      return res.status(400).json({ success: false, message: "The image must be smaller than 5 MB." });
    }

    const uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "Deep",
      resource_type: "image",
    });

    // The account comes from the login token, never from the request body
    const receptionist = await Receptionist.findByIdAndUpdate(
      req.account._id,
      { profilePhoto: uploaded.secure_url },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      profilePhoto: uploaded.secure_url,
      receptionist,
      message: "Profile photo updated successfully",
    });
  } catch (err) {
    return sendError(res, err, "Could not update the photo");
  }
};
