// The queue works with plain "YYYY-MM-DD" dates in Indian time, whatever the computer's own time zone is.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Today's date in India: "2026-10-13"
export function todayIST(now = Date.now()) {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// "2026-10-13" + 1 -> "2026-10-14"
export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "Tue, 13 Oct"
export function formatDay(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
