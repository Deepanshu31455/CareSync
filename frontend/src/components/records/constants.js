// What the receptionist can attach to a visit. The fields match the backend (recordsController).
export const MAX_FILE_MB = 5;

export const KINDS = {
  prescriptions: {
    label: "Prescriptions",
    one: "prescription",
    accept: "image/jpeg,image/png",
    fileHint: "JPG or PNG, up to 5 MB",
    fields: [
      { name: "doctorName", label: "Doctor", required: false },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "reference", label: "Reference", required: false },
    ],
    title: (item) => item.reference || item.doctorName || "Prescription",
    subtitle: (item) => item.date,
  },
  reports: {
    label: "Reports",
    one: "report",
    accept: "image/jpeg,image/png",
    fileHint: "JPG or PNG, up to 5 MB",
    fields: [
      { name: "testName", label: "Test name", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "provider", label: "Lab / provider", required: false },
    ],
    title: (item) => item.testName,
    subtitle: (item) => [item.provider, item.date].filter(Boolean).join(" · "),
  },
  bills: {
    label: "Bills",
    one: "bill",
    accept: "image/jpeg,image/png,application/pdf",
    fileHint: "JPG, PNG or PDF, up to 5 MB",
    fields: [
      { name: "invoiceNumber", label: "Invoice number", required: true },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "status", label: "Status", type: "select", options: ["paid", "pending"], required: false },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "doctorName", label: "Doctor", required: false },
    ],
    title: (item) => `Invoice ${item.invoiceNumber}`,
    subtitle: (item) => [item.amount ? `₹${item.amount}` : null, item.status, item.date].filter(Boolean).join(" · "),
  },
};

export const KIND_ORDER = ["prescriptions", "reports", "bills"];

// Statuses for which the backend accepts records
export const RECORD_STATUSES = ["waiting", "in_consultation", "completed"];
