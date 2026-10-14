const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const { todayIST } = require("../utils/dates");
const { signedUrl } = require("../utils/signedUrl");
const { ageFromDob } = require("../services/queueService");

const MAX_ROWS = 30; // the newest records of each kind

const newestFirst = (a, b) => new Date(b.date || b.consultationDate) - new Date(a.date || a.consultationDate);

// GET /queue/:doctorId/appointments/:id/patient          (the doctor only)
// What the doctor sees about the person in this place of their queue:
//   - a walk-in: nothing extra (no account, no records)
//   - a patient who booked: basic details, allergies and conditions, previous consultations,
//     prescriptions and test reports. NOT bills.
// Allowed only for the doctor's own queue and only for today's or later visits, so a doctor
// cannot browse the records of patients they are not seeing.
exports.getPatientInfo = async (req, res) => {
  try {
    if (req.staff.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Only the doctor can open patient records." });
    }

    const { doctorId, id } = req.params;
    const appointment = await Appointment.findOne({ _id: id, doctor: doctorId })
      .select("patient source status date walkIn tokenNumber")
      .lean();
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });

    if (appointment.source === "walk_in") {
      return res.status(200).json({ success: true, walkIn: true });
    }

    const visiting = ["waiting", "in_consultation", "completed"].includes(appointment.status);
    if (!visiting || appointment.date < todayIST()) {
      return res.status(403).json({ success: false, message: "Records are available only for patients in your current queue." });
    }

    const patient = await Patient.findById(appointment.patient)
      .select("fullName dob gender bloodGroup knownConditions consultations prescriptions reports")
      .populate("consultations.doctor", "fullName specialization")
      .lean();
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    return res.status(200).json({
      success: true,
      walkIn: false,
      patient: {
        name: patient.fullName,
        age: ageFromDob(patient.dob),
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        // written by the patient themself in their profile
        allergiesAndConditions: patient.knownConditions || "",
      },
      consultations: (patient.consultations || [])
        .sort(newestFirst)
        .slice(0, MAX_ROWS)
        .map((c) => ({
          id: String(c._id),
          date: c.consultationDate,
          doctorName: c.doctor ? c.doctor.fullName : "",
          specialization: c.doctor ? c.doctor.specialization : "",
          diagnosis: c.diagnosis,
          notes: c.notes,
        })),
      prescriptions: (patient.prescriptions || [])
        .sort(newestFirst)
        .slice(0, MAX_ROWS)
        .map((p) => ({ id: String(p._id), date: p.date, doctorName: p.doctorName, fileUrl: signedUrl(p.file) })),
      reports: (patient.reports || [])
        .sort(newestFirst)
        .slice(0, MAX_ROWS)
        .map((r) => ({ id: String(r._id), date: r.date, testName: r.testName, provider: r.provider, fileUrl: signedUrl(r.file) })),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Could not load the patient's information" });
  }
};
