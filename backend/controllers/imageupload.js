const fs = require("fs/promises");
const cloudinary = require("cloudinary").v2;

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Receptionist = require("../models/Receptionist");

const MODEL_BY_ROLE = {
  patient: Patient,
  doctor: Doctor,
  receptionist: Receptionist,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

async function hasValidImageSignature(file) {
  try {
    let header = null;

    if (file.tempFilePath) {
      const handle = await fs.open(file.tempFilePath, "r");
      try {
        const buf = Buffer.alloc(12);
        const { bytesRead } = await handle.read(buf, 0, 12, 0);
        header = buf.subarray(0, bytesRead);
      } finally {
        await handle.close();
      }
    } else if (file.data && Buffer.isBuffer(file.data)) {
      header = file.data.subarray(0, 12);
    }

    if (!header || header.length < 3) {
      return false;
    }

    // JPEG signature: FF D8 FF
    const isJpeg =
      header.length >= 3 &&
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff;

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      header.length >= 8 &&
      header
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    // WebP signature: RIFF at 0..3 and WEBP at 8..11
    const isWebp =
      header.length >= 12 &&
      header.subarray(0, 4).toString("ascii") === "RIFF" &&
      header.subarray(8, 12).toString("ascii") === "WEBP";

    return isJpeg || isPng || isWebp;
  } catch (err) {
    console.warn("Signature validation failed:", err.message);
    // Fail closed — a filesystem error is not a reason to accept an unknown file.
    return false;
  }
}

exports.imageUpload = async (req, res) => {
  const file =
    req.files?.imageFile ||
    req.files?.image ||
    req.files?.photo ||
    req.files?.file;

  try {
    // 1. Identify role
    const rawRole = req.user?.role || req.body?.role;
    if (!rawRole) {
      return res.status(400).json({
        success: false,
        message: "Account role is required",
      });
    }

    const role = rawRole.toLowerCase();
    const Model = MODEL_BY_ROLE[role];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: `Invalid account role: ${rawRole}`,
      });
    }

    // 2. Identify user account — strictly bound to the authenticated user only.
    //    Never trust a client-supplied ID: that would let any logged-in user
    //    overwrite another user's profile photo.
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to upload a profile photo",
      });
    }

    const user = await Model.findById(accountId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Validate file existence
    if (!file || Array.isArray(file)) {
      return res.status(400).json({
        success: false,
        message: "Please upload a single profile image",
      });
    }

    // 4. File extension and MIME validation
    const ext = file.name ? file.name.split(".").pop().toLowerCase() : "";
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype?.toLowerCase());
    const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

    if (!isMimeValid && !isExtValid) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, JPEG, PNG, and WebP images are allowed",
      });
    }

    // 5. Size limit check
    if (file.size > MAX_FILE_SIZE || file.truncated) {
      return res.status(413).json({
        success: false,
        message: "The image must be smaller than 5 MB",
      });
    }

    // 6. Magic bytes signature validation
    const validSignature = await hasValidImageSignature(file);
    if (!validSignature) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file is not a valid image",
      });
    }

    // 7. Upload to Cloudinary
    let uploaded;
    if (file.tempFilePath) {
      uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "Deep",
        resource_type: "image",
      });
    } else if (file.data && Buffer.isBuffer(file.data)) {
      const base64Data = `data:${file.mimetype || "image/jpeg"};base64,${file.data.toString("base64")}`;
      uploaded = await cloudinary.uploader.upload(base64Data, {
        folder: "Deep",
        resource_type: "image",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No image file data found to upload",
      });
    }

    // Clean up temporary file from disk
    if (file.tempFilePath) {
      fs.unlink(file.tempFilePath).catch(() => {});
    }

    // 8. Update user profile photo
    const updatedUser = await Model.findByIdAndUpdate(
      user._id,
      { profilePhoto: uploaded.secure_url },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      profilePhoto: uploaded.secure_url,
      user: updatedUser,
      message: "Profile photo updated successfully",
    });

  } catch (err) {
    console.error("Profile image upload failed:", err);

    // Clean up temporary file if left behind
    if (file?.tempFilePath) {
      fs.unlink(file.tempFilePath).catch(() => {});
    }

    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Something went wrong while uploading profile image",
    });
  }
};