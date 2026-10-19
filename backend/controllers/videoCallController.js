const mongoose = require("mongoose");

const VideoVisit = require("../models/VideoVisit");
const Patient = require("../models/Patient");
const { access } = require("../socket/identity");
const { ageFromDob } = require("../services/queueService");

// GET /video-calls/:visitId       (the visit's own doctor or patient; nobody else)
// What the call screen needs before it connects: who I am in this call, the state of the visit and who is on the other side.
// For the doctor it also carries the notes already saved for this visit.
exports.getCall = async (req, res) => {
  try {
    const { visitId } = req.params;
    if (!mongoose.isValidObjectId(visitId)) return res.status(404).json({ success: false, message: "Video visit not found." });

    const userId = await access.resolveUserId(req.user.role, req.user.accountId);
    const visit = await VideoVisit.findById(visitId)
      .populate("doctor", "fullName specialization")
      .populate("patient", "fullName dob gender")
      .lean();
    if (!visit || !userId) return res.status(404).json({ success: false, message: "Video visit not found." });

    const doctorId = String(visit.doctor._id);
    const patientId = String(visit.patient._id);
    const role = userId === doctorId ? "doctor" : userId === patientId ? "patient" : null;
    if (!role) return res.status(404).json({ success: false, message: "Video visit not found." }); // not revealed to others

    const body = {
      success: true,
      role,
      visit: { visitId: String(visit._id), date: visit.date, tokenNumber: visit.tokenNumber, status: visit.status },
      other:
        role === "doctor"
          ? { name: visit.patient.fullName, age: ageFromDob(visit.patient.dob), gender: visit.patient.gender }
          : { name: `Dr. ${visit.doctor.fullName}`, specialization: visit.doctor.specialization },
    };

    if (role === "doctor") {
      body.notes = { diagnosis: "", notes: "" };
      if (visit.consultationId) {
        const patient = await Patient.findById(visit.patient._id).select("consultations").lean();
        const entry = ((patient && patient.consultations) || []).find((c) => String(c._id) === String(visit.consultationId));
        if (entry) body.notes = { diagnosis: entry.diagnosis || "", notes: entry.notes || "" };
      }
    }

    return res.status(200).json(body);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Could not load the call." });
  }
};
