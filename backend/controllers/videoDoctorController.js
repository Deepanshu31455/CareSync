const mongoose = require("mongoose");

const VideoVisit = require("../models/VideoVisit");
const { todayIST, isValidDate, isValidClock, istMoment, addDays } = require("../utils/dates");
const { publishVideoChange, cancelVideoWaiting, endCallRoom } = require("../services/videoService");
const Patient = require("../models/Patient");
const { ageFromDob, isDuplicate } = require("../services/queueService");
const { ensureConsultation } = require("../services/recordsService");
const { BOOKING_WINDOW_DAYS } = require("./doctorSearchController");
const { buildPatientInfo } = require("./doctorPatientController");

// The doctor's side of video visits. ONLY the doctor controls them: these routes act on the logged-in
// doctor's own visits (req.account), and there is no receptionist route for video at all.
//   GET  /doctor/video/queue?date=            the day's video queue
//   PUT  /doctor/video/visits/:id/time        { time: "17:30" | null }   one patient's time
//   POST /doctor/video/schedule               { date, start, minutes, onlyUnscheduled }   times for everyone waiting
//   PUT  /doctor/video/visits/:id/status      { action: "start" | "complete" | "cancel" | "no_show" }

const fail = (res, status, message) => res.status(status).json({ success: false, message });

function serverError(res, err, message) {
  console.log(err);
  return fail(res, 500, message);
}

const GRACE_MS = 5 * 60 * 1000; // a time up to 5 minutes in the past is still accepted ("now")

// One queue row as the doctor's screen shows it. `patient` must be loaded (fullName, dob, gender).
function view(visit) {
  const patient = visit.patient && visit.patient.fullName ? visit.patient : null;
  return {
    visitId: String(visit._id),
    date: visit.date,
    tokenNumber: visit.tokenNumber,
    status: visit.status,
    paymentStatus: visit.paymentStatus,
    scheduledAt: visit.scheduledAt ? new Date(visit.scheduledAt).toISOString() : null,
    ready: Boolean(visit.readyAt),
    name: patient ? patient.fullName : "Patient",
    age: patient ? ageFromDob(patient.dob) : null,
    gender: patient ? patient.gender : null,
  };
}

/* GET /doctor/video/queue?date=2026-10-18   (default: today) */
exports.getQueue = async (req, res) => {
  try {
    const date = req.query.date || todayIST();
    if (!isValidDate(date)) return fail(res, 400, "Invalid date.");

    const rows = await VideoVisit.find({ doctor: req.account._id, date })
      .populate("patient", "fullName dob gender")
      .sort({ tokenNumber: 1 })
      .lean();

    return res.status(200).json({ success: true, date, items: rows.map(view), serverTime: new Date().toISOString() });
  } catch (err) {
    return serverError(res, err, "Could not load the video queue");
  }
};

// Days that have waiting video visits: counts only (the same idea as the clinic's "coming days")
exports.getUpcoming = async (req, res) => {
  try {
    const today = todayIST();
    const rows = await VideoVisit.find({
      doctor: req.account._id,
      status: "waiting",
      date: { $gt: today, $lte: addDays(today, 30) },
    })
      .select("date")
      .lean();

    const counts = {};
    for (const row of rows) counts[row.date] = (counts[row.date] || 0) + 1;
    const days = Object.keys(counts).sort().map((date) => ({ date, count: counts[date] }));
    return res.status(200).json({ success: true, days });
  } catch (err) {
    return serverError(res, err, "Could not load the coming days");
  }
};

/* GET /doctor/video/visits/:id/patient
   What the doctor sees about a patient of their own video queue: details, allergies, previous consultations,
   prescriptions and test reports (no bills). Only for visits that are waiting, in the call or finished, from today on,
   so a doctor cannot browse the records of people they are not seeing. */
exports.getPatientInfo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Video visit not found.");

    const visit = await VideoVisit.findOne({ _id: id, doctor: req.account._id }).select("patient status date").lean();
    if (!visit) return fail(res, 404, "Video visit not found.");

    if (!["waiting", "in_consultation", "completed"].includes(visit.status) || visit.date < todayIST()) {
      return fail(res, 403, "Records are available only for patients in your current video queue.");
    }

    const info = await buildPatientInfo(visit.patient);
    if (!info) return fail(res, 404, "Patient not found.");
    return res.status(200).json(info);
  } catch (err) {
    return serverError(res, err, "Could not load the patient's information");
  }
};

/* PUT /doctor/video/visits/:id/time   { time: "17:30" }  or  { time: null } to clear it */
exports.setTime = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Video visit not found.");

    const { time } = req.body;
    if (time !== null && !isValidClock(time)) return fail(res, 400, "Enter the time like 17:30.");

    const visit = await VideoVisit.findOne({ _id: id, doctor: req.account._id }).lean();
    if (!visit) return fail(res, 404, "Video visit not found.");
    if (visit.status !== "waiting") return fail(res, 409, "Only a waiting patient's time can be changed.");
    if (visit.date < todayIST()) return fail(res, 409, "This visit's day has passed.");

    let update;
    if (time === null) {
      update = { $unset: { scheduledAt: 1, readyAt: 1 } }; // without a time the patient is not available
    } else {
      const moment = istMoment(visit.date, time);
      if (moment.getTime() < Date.now() - GRACE_MS) return fail(res, 400, "That time has already passed.");
      update = { scheduledAt: moment };
    }

    const updated = await VideoVisit.findOneAndUpdate({ _id: id, doctor: req.account._id, status: "waiting" }, update, { new: true });
    if (!updated) return fail(res, 409, "Only a waiting patient's time can be changed.");

    publishVideoChange(req.app.get("io"), updated);
    return res.status(200).json({ success: true, scheduledAt: updated.scheduledAt ? new Date(updated.scheduledAt).toISOString() : null });
  } catch (err) {
    return serverError(res, err, "Could not set the time");
  }
};

/* POST /doctor/video/schedule   { date, start: "17:00", minutes: 10, onlyUnscheduled: true }
   Gives the waiting patients of that day times one after another, in token order:
   start, start + minutes, start + 2 x minutes ... */
exports.scheduleAll = async (req, res) => {
  try {
    const { date, start, minutes, onlyUnscheduled = true } = req.body;
    const today = todayIST();

    if (!isValidDate(date) || date < today) return fail(res, 400, "Choose today or a later day.");
    if (!isValidClock(start)) return fail(res, 400, "Enter the start time like 17:00.");
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 60) return fail(res, 400, "Minutes per patient must be between 5 and 60.");

    const first = istMoment(date, start);
    if (first.getTime() < Date.now() - GRACE_MS) return fail(res, 400, "That start time has already passed.");

    const filter = { doctor: req.account._id, date, status: "waiting" };
    if (onlyUnscheduled) filter.scheduledAt = { $exists: false };

    const visits = await VideoVisit.find(filter).sort({ tokenNumber: 1 }).lean();
    if (visits.length === 0) return fail(res, 404, "No waiting patients to give a time.");

    // Every time must stay inside the same day
    const startMinutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
    if (startMinutes + (visits.length - 1) * minutes >= 24 * 60) {
      return fail(res, 400, "There is not enough room in the day. Start earlier or use fewer minutes per patient.");
    }

    const io = req.app.get("io");
    let given = 0;
    for (let i = 0; i < visits.length; i++) {
      const moment = new Date(first.getTime() + i * minutes * 60 * 1000);
      const updated = await VideoVisit.findOneAndUpdate(
        { _id: visits[i]._id, doctor: req.account._id, status: "waiting" },
        { scheduledAt: moment },
        { new: true }
      );
      if (updated) {
        given++;
        publishVideoChange(io, updated, { skipDoctor: i > 0 }); // the doctor is told once
      }
    }

    return res.status(200).json({ success: true, message: `Times given to ${given} ${given === 1 ? "patient" : "patients"}.`, given });
  } catch (err) {
    return serverError(res, err, "Could not give the times");
  }
};

/* PUT /doctor/video/visits/:id/status   { action } */
exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Video visit not found.");
    if (!["start", "complete", "cancel", "no_show"].includes(action)) return fail(res, 400, "Unknown action.");

    const mine = { _id: id, doctor: req.account._id };
    const today = todayIST();
    let updated = null;

    if (action === "cancel") {
      updated = (await cancelVideoWaiting(mine)).cancelled;
    } else if (action === "start") {
      // Only a patient who marked themselves available, and only on the day
      updated = await VideoVisit.findOneAndUpdate(
        { ...mine, status: "waiting", date: today, readyAt: { $exists: true } },
        { status: "in_consultation", startedAt: new Date() },
        { new: true }
      );
    } else if (action === "complete") {
      updated = await VideoVisit.findOneAndUpdate(
        { ...mine, status: "in_consultation" },
        { status: "completed", completedAt: new Date() },
        { new: true }
      );
    } else {
      updated = await VideoVisit.findOneAndUpdate({ ...mine, status: "waiting", date: today }, { status: "no_show", $unset: { readyAt: 1 } }, { new: true });
    }

    if (!updated) {
      // say what is wrong instead of a general "not found"
      const row = await VideoVisit.findOne(mine).select("status date readyAt").lean();
      if (!row) return fail(res, 404, "Video visit not found.");
      if (action === "start" && row.status === "waiting") {
        if (row.date !== today) return fail(res, 409, "A video call can be started only on the day of the visit.");
        if (!row.readyAt) return fail(res, 409, "This patient has not marked themselves available yet.");
      }
      return fail(res, 409, "This change is not possible right now (check the patient's status and day).");
    }

    publishVideoChange(req.app.get("io"), updated);

    // A finished call goes into the patient's Previous Consultations. The visit is already saved as
    // completed, so a failure here must not fail the request: it is retried when notes are saved.
    if (action === "complete") {
      endCallRoom(req.app.get("io"), updated._id); // the patient's screen leaves the call
      await ensureConsultation(updated._id, "video").catch((err) => console.log("Could not add the consultation:", err.message));
    }

    const populated = await VideoVisit.findById(updated._id).populate("patient", "fullName dob gender").lean();
    return res.status(200).json({ success: true, item: view(populated || updated) });
  } catch (err) {
    if (isDuplicate(err)) return fail(res, 409, "Finish the current call first.");
    return serverError(res, err, "Could not change the status");
  }
};

/* PUT /doctor/video/visits/:id/notes   { diagnosis, notes }
   The doctor's diagnosis and notes for this visit, saved in the patient's Previous Consultations entry.
   During the call, and for 48 hours after it ended. */
const NOTES_HOURS = 48;
exports.saveNotes = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, "Video visit not found.");

    const diagnosis = req.body.diagnosis === undefined ? undefined : String(req.body.diagnosis).trim();
    const notes = req.body.notes === undefined ? undefined : String(req.body.notes).trim();
    if (diagnosis === undefined && notes === undefined) return fail(res, 400, "Write a diagnosis or notes.");
    if (diagnosis !== undefined && diagnosis.length > 300) return fail(res, 400, "The diagnosis can have up to 300 characters.");
    if (notes !== undefined && notes.length > 3000) return fail(res, 400, "The notes can have up to 3000 characters.");

    const visit = await VideoVisit.findOne({ _id: id, doctor: req.account._id }).select("patient status completedAt").lean();
    if (!visit) return fail(res, 404, "Video visit not found.");

    const onCall = visit.status === "in_consultation";
    const recent = visit.status === "completed" && visit.completedAt && Date.now() - new Date(visit.completedAt).getTime() <= NOTES_HOURS * 3600 * 1000;
    if (!onCall && !recent) return fail(res, 409, `Notes can be written during the call and for ${NOTES_HOURS} hours after it.`);

    const consultationId = await ensureConsultation(visit._id, "video");
    if (!consultationId) return fail(res, 404, "The patient's record was not found.");

    const set = {};
    if (diagnosis !== undefined) set["consultations.$.diagnosis"] = diagnosis;
    if (notes !== undefined) set["consultations.$.notes"] = notes;

    const result = await Patient.updateOne({ _id: visit.patient, "consultations._id": consultationId }, { $set: set });
    if (!result || result.matchedCount === 0) return fail(res, 404, "The patient's record was not found.");

    return res.status(200).json({ success: true, message: "Notes saved in the patient's record." });
  } catch (err) {
    return serverError(res, err, "Could not save the notes");
  }
};

exports.GRACE_MS = GRACE_MS;
exports.WINDOW_DAYS = BOOKING_WINDOW_DAYS;
