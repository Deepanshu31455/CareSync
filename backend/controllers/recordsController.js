const fs = require("fs/promises");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { signedUrl } = require("../utils/signedUrl");
const { ensureConsultation } = require("../services/recordsService");

// The receptionist adds the paper side of a visit: prescriptions, test reports and bills.
// They are saved in the patient's own records, marked as added by the hospital (the patient can
// see them but cannot delete them), and linked to the visit's entry in Previous Consultations.
//
//   GET    /queue/:doctorId/appointments/:id/records                      what is saved for this visit
//   POST   /queue/:doctorId/appointments/:id/records/:kind               add one (form data: file + fields)
//   DELETE /queue/:doctorId/appointments/:id/records/:kind/:itemId       remove a hospital upload of this visit
//   :kind = prescriptions | reports | bills

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ["image/jpeg", "image/png"]; // the patient's page shows these as pictures

// The same kinds and rules as the patient's own uploads (patientController), so both look alike.
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

// Records can be added while the person is in the queue, with the doctor, or after the visit
const VISIT_STATUSES = ["waiting", "in_consultation", "completed"];

const fail = (res, status, message) => res.status(status).json({ success: false, message });

function serverError(res, err, message) {
  console.log(err);
  if (err.name === "ValidationError" || err.name === "CastError") return fail(res, 400, err.message);
  return fail(res, 500, message);
}

// The appointment named in the address, if it is this doctor's, for a person with an account, and still a real visit.
// Sends the error itself and returns null otherwise.
async function loadVisit(req, res) {
  const { doctorId, id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    fail(res, 404, "Appointment not found.");
    return null;
  }

  const appointment = await Appointment.findOne({ _id: id, doctor: doctorId })
    .select("patient source status consultationId")
    .lean();

  if (!appointment) {
    fail(res, 404, "Appointment not found.");
    return null;
  }
  if (appointment.source !== "online" || !appointment.patient) {
    fail(res, 400, "Walk-in patients have no records: CareSync keeps nothing about people without an account.");
    return null;
  }
  if (!VISIT_STATUSES.includes(appointment.status)) {
    fail(res, 409, "Records can be added only for a patient who is waiting, with the doctor, or finished.");
    return null;
  }
  return appointment;
}

// One saved item as the screen shows it
function view(kind, item) {
  const result = {
    id: String(item._id),
    kind,
    uploadedBy: item.uploadedBy,
    fileUrl: signedUrl(item.file),
    downloadUrl: signedUrl(item.file, true),
  };
  for (const field of KINDS[kind].fields) result[field] = item[field];
  return result;
}

/* ------------------------------------------------------------------ */
/* GET .../records                                                     */
/* Only what belongs to THIS visit, not the patient's whole history.   */
/* ------------------------------------------------------------------ */
exports.listRecords = async (req, res) => {
  try {
    const appointment = await loadVisit(req, res);
    if (!appointment) return;

    const empty = { success: true, prescriptions: [], reports: [], bills: [] };
    if (!appointment.consultationId) return res.status(200).json(empty); // nothing uploaded yet

    const patient = await Patient.findById(appointment.patient).select("prescriptions reports bills").lean();
    if (!patient) return res.status(200).json(empty);

    const visitId = String(appointment.consultationId);
    const result = { ...empty };
    for (const kind of Object.keys(KINDS)) {
      result[kind] = (patient[kind] || [])
        .filter((item) => item.consultationId && String(item.consultationId) === visitId)
        .map((item) => view(kind, item));
    }
    return res.status(200).json(result);
  } catch (err) {
    return serverError(res, err, "Could not load the records");
  }
};

/* ------------------------------------------------------------------ */
/* POST .../records/:kind     (form data: file + the kind's fields)    */
/* ------------------------------------------------------------------ */
exports.addRecord = async (req, res) => {
  let uploaded = null;
  try {
    const config = KINDS[req.params.kind];
    if (!config) return fail(res, 404, "Unknown kind of record.");

    const appointment = await loadVisit(req, res);
    if (!appointment) return;

    // 1. The file
    const file = req.files && req.files.file;
    if (!file) return fail(res, 400, "Please choose a file.");
    if (!config.types.includes(file.mimetype)) return fail(res, 400, "That file type is not allowed.");
    if (file.size > MAX_FILE_SIZE) return fail(res, 400, "The file must be smaller than 5 MB.");

    // 2. The details: only this kind's fields, required ones present
    const values = {};
    for (const field of config.fields) {
      const value = req.body[field];
      if (value !== undefined && String(value).trim() !== "") values[field] = String(value).trim();
    }
    const missing = config.required.filter((field) => values[field] === undefined);
    if (missing.length) return fail(res, 400, `Please fill in: ${missing.join(", ")}`);

    // 3. The doctor's name is filled in for the clinic
    if (config.fields.includes("doctorName") && !values.doctorName) {
      const doctor = await Doctor.findById(req.params.doctorId).select("fullName").lean();
      if (doctor) values.doctorName = doctor.fullName;
    }

    // 4. The visit's entry in Previous Consultations (created now if it does not exist yet)
    const consultationId = await ensureConsultation(appointment._id);
    if (!consultationId) return fail(res, 500, "Could not link the record to the visit.");

    // 5. Store the file privately: only signed links open it
    uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: config.folder,
      type: "authenticated",
      resource_type: "auto",
    });

    // 6. Save in the patient's records. uploadedBy is always "hospital" here, never taken from the request.
    const itemId = new mongoose.Types.ObjectId();
    const item = {
      _id: itemId,
      ...values,
      consultationId,
      uploadedBy: "hospital",
      file: { publicId: uploaded.public_id, resourceType: uploaded.resource_type, format: uploaded.format || "" },
    };
    const result = await Patient.updateOne({ _id: appointment.patient }, { $push: { [req.params.kind]: item } });
    if (result && result.matchedCount === 0) throw new Error("The patient account no longer exists.");

    if (file.tempFilePath) {
      fs.unlink(file.tempFilePath).catch(() => {});
    }

    return res.status(201).json({ success: true, message: `${config.label} added`, item: view(req.params.kind, item) });
  } catch (err) {
    const file = req.files && req.files.file;
    if (file?.tempFilePath) {
      fs.unlink(file.tempFilePath).catch(() => {});
    }

    // The file was stored but the record was not saved: do not leave the file behind
    if (uploaded) {
      await cloudinary.uploader
        .destroy(uploaded.public_id, { type: "authenticated", resource_type: uploaded.resource_type })
        .catch(() => {});
    }
    return serverError(res, err, "Could not add the record");
  }
};

/* ------------------------------------------------------------------ */
/* DELETE .../records/:kind/:itemId                                    */
/* For a wrong upload. Only the hospital's uploads of this visit.      */
/* ------------------------------------------------------------------ */
exports.deleteRecord = async (req, res) => {
  try {
    const { kind, itemId } = req.params;
    const config = KINDS[kind];
    if (!config) return fail(res, 404, "Unknown kind of record.");
    if (!mongoose.isValidObjectId(itemId)) return fail(res, 404, `${config.label} not found.`);

    const appointment = await loadVisit(req, res);
    if (!appointment) return;
    if (!appointment.consultationId) return fail(res, 404, `${config.label} not found.`);

    const patient = await Patient.findById(appointment.patient).select(kind).lean();
    const item = patient && (patient[kind] || []).find((entry) => String(entry._id) === String(itemId));

    if (!item || !item.consultationId || String(item.consultationId) !== String(appointment.consultationId)) {
      return fail(res, 404, `${config.label} not found.`);
    }
    if (item.uploadedBy !== "hospital") {
      return fail(res, 403, "Only records added by the clinic can be removed here.");
    }

    await Patient.updateOne({ _id: appointment.patient }, { $pull: { [kind]: { _id: item._id } } });

    // Remove the stored file too (if that fails the record is gone anyway)
    await cloudinary.uploader
      .destroy(item.file.publicId, { type: "authenticated", resource_type: item.file.resourceType || "image" })
      .catch((err) => console.log("Could not delete the stored file:", err.message));

    return res.status(200).json({ success: true, message: `${config.label} removed` });
  } catch (err) {
    return serverError(res, err, "Could not remove the record");
  }
};
