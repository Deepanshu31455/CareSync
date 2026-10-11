const mongoose = require("mongoose");
const Patient = require("../models/Patient");

// Runs after authMiddleware (req.user = { accountId, role }):
// only patients get through, and req.patient is the logged-in patient.
// accountId can be the MongoDB _id or the login ID ("175758"); both work here.
// The big record lists are left out; the controller loads them when it needs them.
const loadPatient = async (req, res, next) => {
  try {
    const { accountId, role } = req.user;

    if (role !== "patient") {
      return res.status(403).json({ success: false, message: "Patients only." });
    }

    req.patient = await Patient.findOne(
      mongoose.isValidObjectId(accountId) ? { _id: accountId } : { id: accountId }
    ).select("-consultations -prescriptions -reports -bills");

    if (!req.patient) {
      return res.status(401).json({ success: false, message: "Account not found." });
    }
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

module.exports = { loadPatient };
