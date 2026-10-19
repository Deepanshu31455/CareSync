const fs = require("fs/promises");
const cloudinary = require("cloudinary").v2;

const Patient = require("../models/Patient");

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

// The only personal fields a patient may change.
// Patient ID, email, role and password are NOT here, so they can never be edited.
const EDITABLE_FIELDS = [
  "fullName",
  "phone",
  "dob",
  "gender",
  "address",
  "bloodGroup",
  "emergencyContact",
  "knownConditions",
];

const WITHOUT_RECORDS = "-consultations -prescriptions -reports -bills"; // keeps profile responses small
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

// The three things a patient can upload. The key is also the name of the list on the Patient.
//   fields   = text fields read from the form (and sent back to the page)
//   required = fields that must be filled in
const KINDS = {
  prescriptions: {
    label: "Prescription",
    folder: "patient-prescriptions",
    types: IMAGE_TYPES,
    fields: ["doctorName", "date", "reference"],
    required: ["date"],
  },
  reports: {
    label: "Test report",
    folder: "patient-reports",
    types: IMAGE_TYPES,
    fields: ["testName", "date", "provider"],
    required: ["testName", "date"],
  },
  bills: {
    label: "Bill",
    folder: "patient-bills",
    types: [...IMAGE_TYPES, "application/pdf"],
    fields: ["invoiceNumber", "amount", "status", "date", "doctorName"],
    required: ["invoiceNumber", "amount", "date"],
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Returns an error message if the uploaded file is not acceptable, otherwise null
function checkFile(file, allowedTypes) {
  if (!allowedTypes.includes(file.mimetype)) return "That file type is not allowed.";
  if (file.size > MAX_FILE_SIZE) return "The file must be smaller than 5 MB.";
  return null;
}

// Creates a signed Cloudinary link for a stored file.
// Files are uploaded with type "authenticated", so an unsigned link does not work.
function signedUrl(file, download = false) {
  if (!file || !file.publicId) return null;

  const options = {
    type: "authenticated",
    sign_url: true,
    secure: true,
    resource_type: file.resourceType || "image",
  };
  if (file.format) options.format = file.format;
  if (download) options.flags = "attachment"; // makes the browser download it

  return cloudinary.url(file.publicId, options);
}

// One stored item as the page expects it
function formatItem(kind, item) {
  const result = {
    _id: item._id,
    consultationId: item.consultationId,
    uploadedBy: item.uploadedBy,
    fileUrl: signedUrl(item.file),
    downloadUrl: signedUrl(item.file, true),
  };
  for (const field of KINDS[kind].fields) result[field] = item[field];
  return result;
}

function sendError(res, err, fallback) {
  console.log(err);
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: fallback });
}

/* ------------------------------------------------------------------ */
/* GET /patient/profile                                                */
/* ------------------------------------------------------------------ */
exports.getProfile = async (req, res) => {
  // req.patient was loaded by loadPatient from the login token.
  // The password is never returned (select: false in the schema).
  return res.status(200).json({ success: true, patient: req.patient });
};

/* ------------------------------------------------------------------ */
/* PUT /patient/profile                                                */
/* ------------------------------------------------------------------ */
exports.updateProfile = async (req, res) => {
  try {
    // Copy only the allowed fields, ignore everything else in the request
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    // Phone numbers must be exactly 10 digits
    for (const field of ["phone", "emergencyContact"]) {
      if (updates[field] !== undefined && !/^\d{10}$/.test(updates[field])) {
        return res.status(400).json({ success: false, message: "Enter a 10-digit phone number" });
      }
    }

    const patient = await Patient.findByIdAndUpdate(req.patient._id, updates, {
      new: true,
      runValidators: true,
    }).select(WITHOUT_RECORDS);

    return res.status(200).json({ success: true, patient, message: "Profile updated successfully" });
  } catch (err) {
    return sendError(res, err, "Could not update your profile");
  }
};

/* ------------------------------------------------------------------ */
/* PUT /patient/photo   (form field: imageFile)                        */
/* ------------------------------------------------------------------ */
exports.updatePhoto = async (req, res) => {
  try {
    const file = req.files?.imageFile;
    if (!file) {
      return res.status(400).json({ success: false, message: "Please choose an image." });
    }

    const problem = checkFile(file, IMAGE_TYPES);
    if (problem) return res.status(400).json({ success: false, message: problem });

    // Profile photos are normal (public) images, like the rest of the app
    const uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "Deep",
      resource_type: "image",
    });

    const patient = await Patient.findByIdAndUpdate(
      req.patient._id,
      { profilePhoto: uploaded.secure_url },
      { new: true }
    ).select(WITHOUT_RECORDS);

    if (file.tempFilePath) {
      fs.unlink(file.tempFilePath).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      profilePhoto: uploaded.secure_url,
      patient,
      message: "Profile photo updated successfully",
    });
  } catch (err) {
    if (req.files?.imageFile?.tempFilePath) {
      fs.unlink(req.files.imageFile.tempFilePath).catch(() => {});
    }
    return sendError(res, err, "Could not update the photo");
  }
};

/* ------------------------------------------------------------------ */
/* GET /patient/records                                                */
/* Everything the page lists: consultations, prescriptions, reports,   */
/* bills. Only the logged-in patient's own.                            */
/* ------------------------------------------------------------------ */
exports.getRecords = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient._id)
      .select("consultations prescriptions reports bills")
      .populate("consultations.doctor", "fullName specialization")
      .lean();

    const consultations = patient.consultations.map((c) => ({
      _id: c._id,
      doctor: c.doctor
        ? { fullName: c.doctor.fullName, specialization: c.doctor.specialization }
        : null,
      consultationDate: c.consultationDate,
      reference: c.reference,
      diagnosis: c.diagnosis,
      notes: c.notes,
    }));

    return res.status(200).json({
      success: true,
      consultations,
      prescriptions: patient.prescriptions.map((i) => formatItem("prescriptions", i)),
      reports: patient.reports.map((i) => formatItem("reports", i)),
      bills: patient.bills.map((i) => formatItem("bills", i)),
    });
  } catch (err) {
    return sendError(res, err, "Could not load your records");
  }
};

/* ------------------------------------------------------------------ */
/* POST /patient/<kind>   (form fields: file + the kind's text fields) */
/* One handler is made for each kind: prescriptions, reports, bills.   */
/* ------------------------------------------------------------------ */
function addItem(kind) {
  const config = KINDS[kind];

  return async (req, res) => {
    try {
      // 1. Check the file
      const file = req.files?.file;
      if (!file) {
        return res.status(400).json({ success: false, message: "Please choose a file." });
      }
      const problem = checkFile(file, config.types);
      if (problem) return res.status(400).json({ success: false, message: problem });

      // 2. Take only this kind's fields from the form, and check the required ones
      const values = {};
      for (const field of config.fields) {
        if (req.body[field] !== undefined && req.body[field] !== "") {
          values[field] = req.body[field];
        }
      }
      const missing = config.required.filter((field) => values[field] === undefined);
      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Please fill in: ${missing.join(", ")}`,
        });
      }

      // 3. Store the file. type "authenticated" means only signed links can open it.
      const uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: config.folder,
        type: "authenticated",
        resource_type: "auto",
      });

      // 4. Save the record. uploadedBy is always "patient" here, never taken from the request.
      let updated;
      try {
        updated = await Patient.findByIdAndUpdate(
          req.patient._id,
          {
            $push: {
              [kind]: {
                ...values,
                uploadedBy: "patient",
                file: {
                  publicId: uploaded.public_id,
                  resourceType: uploaded.resource_type,
                  format: uploaded.format || "",
                },
              },
            },
          },
          { new: true, runValidators: true }
        ).select(kind);
      } catch (err) {
        // The record was not valid: remove the file we just stored, then report the error
        await cloudinary.uploader
          .destroy(uploaded.public_id, { type: "authenticated", resource_type: uploaded.resource_type })
          .catch(() => {});
        throw err;
      }

      if (file.tempFilePath) {
        fs.unlink(file.tempFilePath).catch(() => {});
      }

      // The item we just added is the last one in the list
      const added = updated[kind][updated[kind].length - 1];

      return res.status(201).json({
        success: true,
        item: formatItem(kind, added),
        message: `${config.label} uploaded successfully`,
      });
    } catch (err) {
      if (req.files?.file?.tempFilePath) {
        fs.unlink(req.files.file.tempFilePath).catch(() => {});
      }
      return sendError(res, err, `Could not upload the ${config.label.toLowerCase()}`);
    }
  };
}

/* ------------------------------------------------------------------ */
/* DELETE /patient/<kind>/:id                                          */
/* A patient can delete only their own items, never the hospital's.    */
/* ------------------------------------------------------------------ */
function deleteItem(kind) {
  const config = KINDS[kind];

  return async (req, res) => {
    try {
      // Look inside THIS patient's list only, so another patient's id finds nothing
      const patient = await Patient.findById(req.patient._id).select(kind);
      const item = patient[kind].id(req.params.id);

      if (!item) {
        return res.status(404).json({ success: false, message: `${config.label} not found.` });
      }
      if (item.uploadedBy === "hospital") {
        return res.status(403).json({
          success: false,
          message: "Records added by the hospital cannot be deleted.",
        });
      }

      // Remove the stored file (if that fails, still remove the record)
      try {
        await cloudinary.uploader.destroy(item.file.publicId, {
          type: "authenticated",
          resource_type: item.file.resourceType || "image",
        });
      } catch (err) {
        console.log("Could not delete the stored file:", err.message);
      }

      await Patient.updateOne({ _id: req.patient._id }, { $pull: { [kind]: { _id: item._id } } });

      return res.status(200).json({ success: true, message: `${config.label} deleted` });
    } catch (err) {
      return sendError(res, err, `Could not delete the ${config.label.toLowerCase()}`);
    }
  };
}

exports.addPrescription = addItem("prescriptions");
exports.deletePrescription = deleteItem("prescriptions");
exports.addReport = addItem("reports");
exports.deleteReport = deleteItem("reports");
exports.addBill = addItem("bills");
exports.deleteBill = deleteItem("bills");
