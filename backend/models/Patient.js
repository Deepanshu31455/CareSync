const mongoose = require("mongoose");
const { baseUserFields, hashPassword } = require("./baseUserFields");

// A file stored in Cloudinary. We save the publicId (not a public link);
// the controller creates a signed link only for the owner of the record.
const fileSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true },
    resourceType: { type: String, default: "image" }, // "image" also covers PDFs in Cloudinary
    format: { type: String, default: "" },
  },
  { _id: false }
);

// Who added an item: the patient (can delete it) or the hospital (cannot be deleted by the patient)
const uploadedBy = { type: String, enum: ["patient", "hospital"], default: "patient" };

// A visit to a doctor. Added by the hospital; the patient can only read these.
// The receptionist can add one with:
//   Patient.updateOne({ id }, { $push: { consultations: { doctor, consultationDate, ... } } })
const consultationSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  consultationDate: { type: Date, required: true },
  reference: { type: String, default: "" }, // visit / token reference
  diagnosis: { type: String, default: "" },
  notes: { type: String, default: "" }, // medical history for this visit lives here
});

// consultationId (optional) links the item to one of the consultations above.
const prescriptionSchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId },
  doctorName: { type: String, default: "" },
  date: { type: Date, required: true },
  reference: { type: String, default: "" },
  file: { type: fileSchema, required: true },
  uploadedBy,
});

const reportSchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId },
  testName: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  provider: { type: String, default: "" }, // laboratory / provider
  file: { type: fileSchema, required: true },
  uploadedBy,
});

const billSchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId },
  invoiceNumber: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["paid", "pending"], default: "paid" },
  date: { type: Date, required: true }, // payment date
  doctorName: { type: String, default: "" },
  file: { type: fileSchema, required: true },
  uploadedBy,
});

const patientSchema = new mongoose.Schema(
  {
    ...baseUserFields,
    role: { type: String, default: "patient", immutable: true },

    // Patient-specific, from RegisterPage_DetailsStep's patient branch
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    emergencyContact: { type: String, required: true },
    knownConditions: { type: String, default: "" }, // optional — allergies / existing conditions

    // Shown on the Patient Profile page
    consultations: [consultationSchema],
    prescriptions: [prescriptionSchema],
    reports: [reportSchema], // test reports
    bills: [billSchema],
  },
  { timestamps: true }
);

patientSchema.pre("save", hashPassword);

module.exports = mongoose.model("Patient", patientSchema);
