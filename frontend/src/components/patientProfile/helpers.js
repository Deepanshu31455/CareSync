import { MAX_FILE_MB } from "./constants";

// 12 Mar 2026  (or "—" when there is no date)
export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ₹1,500.00
export function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount ?? 0);
}

// "Dr. Name", or a fallback when the doctor record is missing
export function doctorLabel(doctor) {
  return doctor?.fullName ? `Dr. ${doctor.fullName}` : "Doctor";
}

// Keeps digits only and cuts the value to 10 characters
export function onlyTenDigits(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

// rules = { accept: [...mime types], acceptText: "JPG or PNG" }
// Returns an error message if the picked file is not allowed, otherwise null.
export function checkFile(file, rules) {
  if (!rules.accept.includes(file.type)) return `Only ${rules.acceptText} files are allowed.`;
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `The file must be smaller than ${MAX_FILE_MB} MB.`;
  return null;
}

// The patient can delete everything except items the hospital added.
export function canDelete(item) {
  return item.uploadedBy !== "hospital";
}

// Newest first, by the given date field
export function newestFirst(items, field = "date") {
  return [...items].sort((a, b) => new Date(b[field]) - new Date(a[field]));
}

// Builds the editable form from the saved profile.
// Patient ID and email are deliberately NOT in here, so they can never be edited.
export function buildForm(profile) {
  return {
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    dob: profile.dob ? String(profile.dob).slice(0, 10) : "", // yyyy-mm-dd for the date input
    gender: profile.gender || "",
    address: profile.address || "",
    bloodGroup: profile.bloodGroup || "",
    emergencyContact: profile.emergencyContact || "",
    knownConditions: profile.knownConditions || "",
  };
}
