import { MAX_FILE_MB } from "./constants";

// 12 Mar 2026  (or "—" when there is no date)
export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ₹1,500
export function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount ?? 0);
}

// Keeps digits only, cut to `max` characters (10 for phone numbers)
export function onlyDigits(value, max = 10) {
  return String(value).replace(/\D/g, "").slice(0, max);
}

// rules = { accept: [...mime types], acceptText: "JPG or PNG" }
// Returns an error message if the picked file is not allowed, otherwise null.
export function checkFile(file, rules) {
  if (!rules.accept.includes(file.type)) return `Only ${rules.acceptText} files are allowed.`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `The file must be smaller than ${MAX_FILE_MB} MB.`;
  return null;
}
