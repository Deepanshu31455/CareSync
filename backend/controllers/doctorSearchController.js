const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { todayIST, isValidDate, isDoctorOpenOn, isDoctorBookableOn, addDays, weekdayOf } = require("../utils/dates");
const { summary } = require("../services/queueService");

// What a patient may see about a doctor. No email, phone, licence number or password.
const CARD =
  "id fullName specialization qualifications experience affiliation consultationFee clinicAddress profilePhoto rating totalRatings workingHours";
const DETAIL = `${CARD} facilities otherDescription directions googleExperience`;

const BOOKING_WINDOW_DAYS = 7;  // a patient can book today and up to this many days ahead
const MAX_RESULTS = 20;
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The weekdays the doctor consults, in order: ["Monday", "Wednesday"]
function consultingDays(doctor) {
  const open = new Set((doctor.workingHours || []).filter((w) => !w.isClosed).map((w) => w.day));
  return WEEK.filter((day) => open.has(day));
}

// The doctor as a search result card (no database id)
function toCard(doctor, date, queue) {
  const open = isDoctorBookableOn(doctor, date);
  return {
    id: doctor.id,
    fullName: doctor.fullName,
    specialization: doctor.specialization,
    qualifications: doctor.qualifications,
    experience: doctor.experience,
    affiliation: doctor.affiliation,
    consultationFee: doctor.consultationFee,
    clinicAddress: doctor.clinicAddress,
    profilePhoto: doctor.profilePhoto,
    rating: doctor.rating,
    totalRatings: doctor.totalRatings,
    consultingDays: consultingDays(doctor),
    date,
    open, // consulting on the chosen day
    queue: open ? queue : null, // { nowServing, waiting } on that day
  };
}

/* ------------------------------------------------------------------ */
/* GET /doctors/search?q=heart&date=2026-10-13&consulting=1            */
/* Patients only. Verified doctors; `open` says whether they consult   */
/* on that day, `queue` how busy the day is.                           */
/* ------------------------------------------------------------------ */
exports.searchDoctors = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 60);
    const today = todayIST();
    const date = req.query.date || today;

    if (!isValidDate(date) || date < today || date > addDays(today, BOOKING_WINDOW_DAYS)) {
      return fail(res, 400, `Choose a day from today up to ${BOOKING_WINDOW_DAYS} days ahead.`);
    }

    const filter = { emailVerified: true };
    if (q.length >= 2) {
      const pattern = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ fullName: pattern }, { specialization: pattern }];
    }

    // A few more than we show: the "consulting that day" filter is applied afterwards
    const found = await Doctor.find(filter)
      .select(CARD)
      .sort({ rating: -1, fullName: 1 })
      .limit(MAX_RESULTS * 3)
      .lean();

    let doctors = found.filter((doctor) => doctor.id);
    if (req.query.consulting === "1") {
      doctors = doctors.filter((doctor) => isDoctorBookableOn(doctor, date));
    }
    doctors = doctors.slice(0, MAX_RESULTS);

    // How busy each doctor's day is: ONE grouped query for all of them
    const queues = new Map();
    const ids = doctors.filter((d) => isDoctorBookableOn(d, date)).map((d) => d._id);
    if (ids.length > 0) {
      const rows = await Appointment.aggregate([
        { $match: { doctor: { $in: ids }, date, status: { $in: ["waiting", "in_consultation"] } } },
        { $group: { _id: { doctor: "$doctor", status: "$status" }, count: { $sum: 1 }, token: { $max: "$tokenNumber" } } },
      ]);
      for (const row of rows) {
        const key = String(row._id.doctor);
        const entry = queues.get(key) || { nowServing: null, waiting: 0 };
        if (row._id.status === "waiting") entry.waiting = row.count;
        else entry.nowServing = row.token;
        queues.set(key, entry);
      }
    }

    return res.status(200).json({
      success: true,
      date,
      doctors: doctors.map((doctor) =>
        toCard(doctor, date, queues.get(String(doctor._id)) || { nowServing: null, waiting: 0 })
      ),
    });
  } catch (err) {
    console.log(err);
    return fail(res, 500, "Could not search doctors");
  }
};

/* ------------------------------------------------------------------ */
/* GET /doctors/:doctorId        (:doctorId = the 6-digit ID)          */
/* The doctor's page: details, hours, the days that can be booked,     */
/* and today's queue.                                                  */
/* ------------------------------------------------------------------ */
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.doctorId, emailVerified: true }).select(DETAIL).lean();
    if (!doctor || !doctor.id) return fail(res, 404, "Doctor not found.");

    const today = todayIST();
    const days = [];
    for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
      const date = addDays(today, i);
      days.push({ date, weekday: weekdayOf(date), open: isDoctorBookableOn(doctor, date) });
    }

    const { nowServing, waiting } = await summary(doctor._id, today);
    // Only these fields leave the server (written out one by one, so a field added to the doctor
    // later is never shown to patients by accident)
    const {
      id, fullName, specialization, qualifications, experience, affiliation, consultationFee,
      clinicAddress, profilePhoto, rating, totalRatings, facilities, otherDescription,
      directions, googleExperience, workingHours,
    } = doctor;

    return res.status(200).json({
      success: true,
      doctor: {
        id, fullName, specialization, qualifications, experience, affiliation, consultationFee,
        clinicAddress, profilePhoto, rating, totalRatings, facilities, otherDescription,
        directions, googleExperience,
        consultingDays: consultingDays(doctor),
        workingHours: (workingHours || []).map(({ day, time, isClosed }) => ({ day, time, isClosed })),
      },
      days, // the next two weeks, each with open: true/false
      today: { date: today, nowServing, waiting },
    });
  } catch (err) {
    console.log(err);
    return fail(res, 500, "Could not load the doctor");
  }
};

exports.BOOKING_WINDOW_DAYS = BOOKING_WINDOW_DAYS;
