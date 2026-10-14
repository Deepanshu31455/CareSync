// Dates in the queue are plain "YYYY-MM-DD" strings in Indian time, so "today" means
// the same thing for the server, the clinic and the patients, wherever the server runs.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Today's date in India: "2026-10-13"
function todayIST(now = Date.now()) {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// True only for a real calendar date written as YYYY-MM-DD
function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// "Tuesday" for "2026-10-13" (the names used in the doctor's working hours)
function weekdayOf(date) {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

// A moment `days` after the end of that date (used to decide when old records are removed)
function endOfDatePlusDays(date, days) {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + (days + 1) * DAY_MS - IST_OFFSET_MS);
}

// "2026-10-13" + 1 -> "2026-10-14"
function addDays(date, days) {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

// Is the doctor working that weekday, according to their saved Working Days & Hours?
//   strict: false -> only an explicit "Closed" counts as closed (no schedule saved = open)
//   strict: true  -> no schedule entry counts as closed (use this for online booking)
function isDoctorOpenOn(doctor, date, { strict = false } = {}) {
  const entry = (doctor.workingHours || []).find((w) => w.day === weekdayOf(date));
  if (!entry) return !strict;
  return !entry.isClosed;
}

module.exports = { todayIST, isValidDate, weekdayOf, addDays, endOfDatePlusDays, isDoctorOpenOn };
