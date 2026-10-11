import { FlaskConical, Pill, Receipt, Stethoscope, User } from "lucide-react";

/* ------------------------------------------------------------------ */
/* BACKEND: change these addresses to match your routes                */
/* ------------------------------------------------------------------ */

export const BASE = "http://localhost:4000/api/v1";

// What the page sends and expects back (all calls use the login cookie):
//
//  profile        GET  -> { patient }               PUT (JSON) -> { patient }
//  photo          PUT  (FormData: imageFile)        -> { profilePhoto }
//  records        GET  -> { consultations, prescriptions, reports, bills }
//  prescriptions  POST (FormData: file + fields)    -> { item }     DELETE /:id
//  reports        POST (FormData: file + fields)    -> { item }     DELETE /:id
//  bills          POST (FormData: file + fields)    -> { item }     DELETE /:id
export const ENDPOINTS = {
  profile: "/patient/profile",
  photo: "/patient/photo",
  records: "/patient/records",
  prescriptions: "/patient/prescriptions",
  reports: "/patient/test-reports",
  bills: "/patient/bills",
};

// Shape of the data (field names the page reads):
//  patient       { id, fullName, email, phone, dob, gender, address, bloodGroup,
//                  emergencyContact, knownConditions, profilePhoto }
//  consultation  { _id, doctor: { fullName, specialization }, consultationDate,
//                  reference, diagnosis, notes }
//  prescription  { _id, consultationId?, doctorName, date, reference, fileUrl, downloadUrl, uploadedBy? }
//  report        { _id, consultationId?, testName, date, provider, fileUrl, downloadUrl, uploadedBy? }
//  bill          { _id, consultationId?, invoiceNumber, amount, status, date, doctorName?,
//                  fileUrl, downloadUrl, uploadedBy? }
//
//  consultationId (optional) links an item to a consultation.
//  uploadedBy: "hospital" hides the Delete button, anything else lets the patient delete it.

/* ------------------------------------------------------------------ */
/* PAGE SETTINGS                                                       */
/* ------------------------------------------------------------------ */

// The sections of the page, in menu order
export const TABS = [
  { key: "personal", label: "Personal Information", icon: User },
  { key: "consultations", label: "Previous Consultations", icon: Stethoscope },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "reports", label: "Test Reports", icon: FlaskConical },
  { key: "bills", label: "Bills & Payments", icon: Receipt },
];

// Options for the edit form (same values as the Patient model)
export const GENDERS = ["male", "female", "other", "prefer-not-to-say"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Rules for uploaded files
export const MAX_FILE_MB = 5;
const IMAGES = ["image/jpeg", "image/png"];

export const PHOTO_RULES = { accept: IMAGES, acceptText: "JPG or PNG" };

// What each uploadable item type needs. The upload form is built from `fields`.
export const KINDS = {
  prescriptions: {
    label: "Prescription",
    title: "Prescriptions",
    hint: "Upload your prescriptions and keep them in one place. Tap an image to view it larger.",
    empty: "No prescriptions yet. Upload one, or it will appear here once the hospital adds it.",
    accept: IMAGES,
    acceptText: "JPG or PNG",
    fields: [
      { name: "doctorName", label: "Doctor name", type: "text" },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "reference", label: "Reference (optional)", type: "text" },
    ],
  },

  reports: {
    label: "Test report",
    title: "Test Reports",
    hint: "Upload your test reports. Tap an image to view it larger.",
    empty: "No test reports yet. Upload one, or it will appear here once the hospital adds it.",
    accept: IMAGES,
    acceptText: "JPG or PNG",
    fields: [
      { name: "testName", label: "Test name", type: "text", required: true },
      { name: "date", label: "Report date", type: "date", required: true },
      { name: "provider", label: "Laboratory (optional)", type: "text" },
    ],
  },

  bills: {
    label: "Bill",
    title: "Bills & Payments",
    hint: "All your bills, latest first.",
    empty: "No bills yet. Upload one, or it will appear here once the hospital bills a consultation.",
    accept: [...IMAGES, "application/pdf"],
    acceptText: "JPG, PNG or PDF",
    fields: [
      { name: "invoiceNumber", label: "Invoice number", type: "text", required: true },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
      { name: "date", label: "Payment date", type: "date", required: true },
      { name: "status", label: "Status", type: "select", options: ["paid", "pending"] },
    ],
  },
};

// Shared Tailwind classes
export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
