const crypto = require("crypto");
const mongoose = require("mongoose");

const Assignment = require("../models/Assignment");
const Doctor = require("../models/Doctor");
const { sendMail } = require("../utils/sendMail");
const { revokeQueueAccess } = require("../socket/emitter");

/* ------------------------------------------------------------------ */
/* Settings and small helpers                                          */
/* ------------------------------------------------------------------ */

const REQUEST_VALID_DAYS = 7; // the emailed link stops working after this

function getClientUrl(req) {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.replace(/\/+$/, "");
  }
  const origin = req?.headers?.origin || req?.headers?.referer;
  if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    try {
      const url = new URL(origin);
      return url.origin;
    } catch {}
  }
  if (process.env.NODE_ENV === "production" || process.env.RENDER) {
    return "https://caresync-ph5d.onrender.com";
  }
  return "http://localhost:5173";
}

// What the other side is allowed to see about a person
const DOCTOR_CARD = "id fullName specialization profilePhoto clinicAddress consultationFee";
const STAFF_CARD = "fullName profilePhoto email"; // pending: enough to recognise them
const STAFF_CARD_ACTIVE = "fullName profilePhoto email phone"; // active: contact details too

const OPEN = ["pending", "active"];

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fail = (res, status, message) => res.status(status).json({ success: false, message });

function serverError(res, err, message) {
  console.log(err);
  return fail(res, 500, message);
}

// The two ways a pending request can be answered
const ACTIONS = ["accept", "reject"];

/* ------------------------------------------------------------------ */
/* The three state changes. Each is ONE atomic database update that    */
/* only matches when the assignment is in the right state, so a link   */
/* can be used once, an expired request cannot be accepted, and two    */
/* clicks at the same time cannot both succeed.                        */
/* ------------------------------------------------------------------ */

// Doctor answers a pending request. `filter` says which request (by id or by token).
function settle(filter, action) {
  const accept = action === "accept";
  const now = new Date();

  return Assignment.findOneAndUpdate(
    { ...filter, status: "pending", tokenExpires: { $gt: now } },
    {
      status: accept ? "active" : "rejected",
      respondedAt: now,
      // the token is used up; a rejected pair is free to try again later
      $unset: accept ? { tokenHash: 1, tokenExpires: 1 } : { tokenHash: 1, tokenExpires: 1, pairKey: 1 },
    },
    { new: true }
  );
}

// Receptionist withdraws a pending request
function cancel(filter) {
  return Assignment.findOneAndUpdate(
    { ...filter, status: "pending" },
    { status: "cancelled", respondedAt: new Date(), $unset: { tokenHash: 1, tokenExpires: 1, pairKey: 1 } },
    { new: true }
  );
}

// Either side ends an active assignment. History (appointments, prescriptions...) is untouched.
function end(filter, endedBy) {
  return Assignment.findOneAndUpdate(
    { ...filter, status: "active" },
    { status: "ended", endedAt: new Date(), endedBy, $unset: { pairKey: 1 } },
    { new: true }
  );
}

/* ================================================================== */
/* RECEPTIONIST SIDE  (authMiddleware + loadReceptionist)              */
/* ================================================================== */

// GET /receptionist/doctors  ->  { doctors: [...active], requests: [...pending] }
exports.listForReceptionist = async (req, res) => {
  try {
    const rows = await Assignment.find({ receptionist: req.account._id, status: { $in: OPEN } })
      .populate("doctor", DOCTOR_CARD)
      .sort({ requestedAt: -1 })
      .lean();

    const now = Date.now();
    const doctors = [];
    const requests = [];

    for (const row of rows) {
      if (!row.doctor) continue; // the doctor account no longer exists

      if (row.status === "active") {
        doctors.push({ assignmentId: row._id, since: row.respondedAt, doctor: row.doctor });
      } else {
        requests.push({
          assignmentId: row._id,
          requestedAt: row.requestedAt,
          expiresAt: row.tokenExpires,
          expired: new Date(row.tokenExpires).getTime() < now,
          doctor: row.doctor,
        });
      }
    }

    return res.status(200).json({ success: true, doctors, requests });
  } catch (err) {
    return serverError(res, err, "Could not load your doctors");
  }
};

// GET /receptionist/doctors/search?q=...  ->  { doctors: [...] }
// Verified doctors matching the name or specialization, minus those already
// connected to (or waiting on) this receptionist.
exports.searchDoctors = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.status(200).json({ success: true, doctors: [] });

    const taken = await Assignment.find({ receptionist: req.account._id, status: { $in: OPEN } }).distinct("doctor");
    const pattern = new RegExp(escapeRegex(q), "i");

    const doctors = await Doctor.find({
      emailVerified: true,
      _id: { $nin: taken },
      $or: [{ fullName: pattern }, { specialization: pattern }],
    })
      .select(DOCTOR_CARD)
      .limit(10)
      .lean();

    return res.status(200).json({ success: true, doctors });
  } catch (err) {
    return serverError(res, err, "Could not search doctors");
  }
};

// POST /receptionist/requests   { doctorId }
// Creates a PENDING request and emails the doctor. Nothing is connected yet:
// the receptionist gets no access until the doctor accepts.
exports.sendRequest = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!mongoose.isValidObjectId(doctorId)) return fail(res, 400, "Choose a doctor first.");

    const doctor = await Doctor.findOne({ _id: doctorId, emailVerified: true }).select(DOCTOR_CARD + " email");
    if (!doctor) return fail(res, 404, "Doctor not found.");

    // 1. Save the request. The unique pairKey refuses a duplicate.
    const token = crypto.randomBytes(32).toString("hex");
    let assignment;
    try {
      assignment = await Assignment.create({
        doctor: doctor._id,
        receptionist: req.account._id,
        pairKey: `${doctor._id}_${req.account._id}`,
        tokenHash: hashToken(token),
        tokenExpires: new Date(Date.now() + REQUEST_VALID_DAYS * 24 * 60 * 60 * 1000),
      });
    } catch (err) {
      if (err.code === 11000) {
        return fail(res, 409, "You already have a request or an assignment with this doctor.");
      }
      throw err;
    }

    // 2. Email the doctor. If that fails, remove the request so nothing is left hanging.
    const link = `${getClientUrl(req)}/assignment/respond?token=${token}`;
    try {
      await sendMail({
        to: doctor.email,
        subject: `${req.account.fullName} wants to manage your appointments on CareSync`,
        text: `Hello Dr. ${doctor.fullName},\n\n${req.account.fullName} (${req.account.email}) has asked to work as your receptionist on CareSync.\n\nThey get no access until you accept.\nReview this request: ${link}\n\nThe link works once and expires in ${REQUEST_VALID_DAYS} days. If you do not know this person, ignore this email.`,
        html: `
          <p>Hello Dr. ${escapeHtml(doctor.fullName)},</p>
          <p><b>${escapeHtml(req.account.fullName)}</b> (${escapeHtml(req.account.email)}) has asked to work as your receptionist on CareSync.</p>
          <p>They get no access until you accept.</p>
          <p><a href="${link}">Review this request</a></p>
          <p>The link works once and expires in ${REQUEST_VALID_DAYS} days. If you do not know this person, ignore this email.</p>`,
      });
    } catch (err) {
      await Assignment.deleteOne({ _id: assignment._id });
      console.error("Request email failed:", err);
      return fail(res, 502, `Could not send email to doctor: ${err.message || "Failed to deliver email"}`);
    }

    return res.status(201).json({
      success: true,
      message: "Request sent. The doctor has been emailed.",
      request: {
        assignmentId: assignment._id,
        requestedAt: assignment.requestedAt,
        expiresAt: assignment.tokenExpires,
        expired: false,
        doctor: {
          _id: doctor._id,
          fullName: doctor.fullName,
          specialization: doctor.specialization,
          profilePhoto: doctor.profilePhoto,
          clinicAddress: doctor.clinicAddress,
          consultationFee: doctor.consultationFee,
        },
      },
    });
  } catch (err) {
    return serverError(res, err, "Could not send the request");
  }
};

// DELETE /receptionist/requests/:id   (withdraw a pending request)
exports.cancelRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Request not found.");

    const done = await cancel({ _id: req.params.id, receptionist: req.account._id });
    if (!done) return fail(res, 404, "Request not found.");

    return res.status(200).json({ success: true, message: "Request cancelled" });
  } catch (err) {
    return serverError(res, err, "Could not cancel the request");
  }
};

// DELETE /receptionist/doctors/:id   (end an active assignment; :id is the assignmentId)
exports.removeDoctor = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Assignment not found.");

    const done = await end({ _id: req.params.id, receptionist: req.account._id }, "receptionist");
    if (!done) return fail(res, 404, "Assignment not found.");

    // take the receptionist out of that doctor's live queue right away
    revokeQueueAccess(req.app.get("io"), done.receptionist, done.doctor).catch(() => {});

    return res.status(200).json({ success: true, message: "Doctor removed from your list" });
  } catch (err) {
    return serverError(res, err, "Could not remove the doctor");
  }
};

/* ================================================================== */
/* DOCTOR SIDE  (authMiddleware + loadDoctor)                          */
/* ================================================================== */

// GET /doctor/staff  ->  { receptionists: [...active], requests: [...pending] }
exports.listForDoctor = async (req, res) => {
  try {
    const rows = await Assignment.find({ doctor: req.account._id, status: { $in: OPEN } })
      .populate({ path: "receptionist", select: STAFF_CARD_ACTIVE })
      .sort({ requestedAt: -1 })
      .lean();

    const now = Date.now();
    const receptionists = [];
    const requests = [];

    for (const row of rows) {
      if (!row.receptionist) continue;

      if (row.status === "active") {
        receptionists.push({ assignmentId: row._id, since: row.respondedAt, receptionist: row.receptionist });
      } else {
        // pending: no phone number until the doctor accepts
        const { phone, ...basic } = row.receptionist;
        requests.push({
          assignmentId: row._id,
          requestedAt: row.requestedAt,
          expiresAt: row.tokenExpires,
          expired: new Date(row.tokenExpires).getTime() < now,
          receptionist: basic,
        });
      }
    }

    return res.status(200).json({ success: true, receptionists, requests });
  } catch (err) {
    return serverError(res, err, "Could not load your staff");
  }
};

// PUT /doctor/requests/:id   { action: "accept" | "reject" }   (answer while signed in)
exports.respondInApp = async (req, res) => {
  try {
    const { action } = req.body;
    if (!ACTIONS.includes(action)) return fail(res, 400, "Action must be accept or reject.");
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Request not found.");

    const done = await settle({ _id: req.params.id, doctor: req.account._id }, action);
    if (!done) return fail(res, 410, "This request is no longer open (answered, cancelled or expired).");

    return res.status(200).json({
      success: true,
      message: action === "accept" ? "Receptionist added to your clinic" : "Request declined",
    });
  } catch (err) {
    return serverError(res, err, "Could not answer the request");
  }
};

// DELETE /doctor/staff/:id   (end an active assignment; :id is the assignmentId)
exports.removeReceptionist = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, "Assignment not found.");

    const done = await end({ _id: req.params.id, doctor: req.account._id }, "doctor");
    if (!done) return fail(res, 404, "Assignment not found.");

    revokeQueueAccess(req.app.get("io"), done.receptionist, done.doctor).catch(() => {});

    return res.status(200).json({ success: true, message: "Receptionist removed" });
  } catch (err) {
    return serverError(res, err, "Could not remove the receptionist");
  }
};

/* ================================================================== */
/* PUBLIC  (the emailed link; the secret token is the only credential) */
/* ================================================================== */

const NO_LONGER_VALID = "This request is no longer valid. It may be answered, cancelled or expired.";

// GET /assignments/preview?token=...
// Only reads. Opening the link (or an email scanner fetching it) changes nothing.
exports.previewByToken = async (req, res) => {
  try {
    const token = String(req.query.token || "");
    if (!token) return fail(res, 400, "Missing token.");

    const row = await Assignment.findOne({
      tokenHash: hashToken(token),
      status: "pending",
      tokenExpires: { $gt: new Date() },
    })
      .populate("doctor", "fullName")
      .populate("receptionist", STAFF_CARD)
      .lean();

    if (!row || !row.doctor || !row.receptionist) return fail(res, 410, NO_LONGER_VALID);

    return res.status(200).json({
      success: true,
      request: {
        doctorName: row.doctor.fullName,
        receptionist: row.receptionist,
        requestedAt: row.requestedAt,
        expiresAt: row.tokenExpires,
      },
    });
  } catch (err) {
    return serverError(res, err, "Could not open the request");
  }
};

// POST /assignments/respond   { token, action: "accept" | "reject" }
exports.respondByToken = async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const { action } = req.body;
    if (!token) return fail(res, 400, "Missing token.");
    if (!ACTIONS.includes(action)) return fail(res, 400, "Action must be accept or reject.");

    const done = await settle({ tokenHash: hashToken(token) }, action);
    if (!done) return fail(res, 410, NO_LONGER_VALID);

    return res.status(200).json({
      success: true,
      message: action === "accept" ? "Receptionist added to your clinic" : "Request declined",
    });
  } catch (err) {
    return serverError(res, err, "Could not answer the request");
  }
};
