import { DAYS, DEFAULT_OPEN, DEFAULT_CLOSE } from "./constants";

// "12:00 AM", "12:30 AM", ... "11:30 PM"
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours24 = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
});

// Turns "09:00 AM – 05:00 PM" into { start, end }. Falls back to defaults.
export function parseTimeRange(text) {
  if (typeof text === "string") {
    const [start, end] = text.split(/\s*[–-]\s*/).map((s) => s.trim());
    if (TIME_OPTIONS.includes(start) && TIME_OPTIONS.includes(end)) {
      return { start, end };
    }
  }
  return { start: DEFAULT_OPEN, end: DEFAULT_CLOSE };
}

export function formatTimeRange(start, end) {
  return `${start} – ${end}`;
}

// Always returns exactly seven days, Monday to Sunday, in a clean shape.
export function normalizeWorkingHours(saved) {
  return DAYS.map((day) => {
    const match = Array.isArray(saved)
      ? saved.find((slot) => slot.day?.toLowerCase() === day.toLowerCase())
      : null;

    if (!match) {
      return day === "Sunday"
        ? { day, time: "Closed", isClosed: true }
        : { day, time: formatTimeRange(DEFAULT_OPEN, DEFAULT_CLOSE), isClosed: false };
    }

    if (match.isClosed) return { day, time: "Closed", isClosed: true };

    const { start, end } = parseTimeRange(match.time);
    return { day, time: formatTimeRange(start, end), isClosed: false };
  });
}

export function isValidRange(start, end) {
  return TIME_OPTIONS.indexOf(end) > TIME_OPTIONS.indexOf(start);
}
