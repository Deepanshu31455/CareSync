const express = require("express");
const router  = express.Router();

// controllers
const { sendotp }                                   = require("../controllers/sendotp");
const { verifyotp }                                 = require("../controllers/verifyotp");
const { auth }                                      = require("../controllers/auth");
const { login }                                     = require("../controllers/login");
const { logout }                                    = require("../controllers/logout");
const { getMe }                                     = require("../controllers/auththroughcookie");
const { verifyGoogleForRegistration, loginWithGoogle } = require("../controllers/googleauth");
const { imageUpload }                               = require("../controllers/imageupload");
const { getDoctorProfile, updateDoctorProfile }     = require("../controllers/doctorController");
const {
  getProfile,
  updateProfile,
  updatePhoto,
  getRecords,
  addPrescription,
  deletePrescription,
  addReport,
  deleteReport,
  addBill,
  deleteBill,
} = require("../controllers/patientController");

// middleware
const { authMiddleware } = require("../middlewares/authMiddleware");
const { loadPatient }    = require("../middlewares/loadPatient");

// ─── Auth / general ──────────────────────────────────────────────────────────
router.get( "/me",              (req, res, next) => { console.log("HIT /me"); next(); }, getMe);
router.post("/send-otp",        sendotp);
router.post("/verify-otp",      verifyotp);
router.post("/register/:role",  auth);
router.post("/login",           login);
router.post("/logout",          logout);
router.post("/googleregister",  verifyGoogleForRegistration);
router.post("/googlelogin",     loginWithGoogle);
router.put( "/imageUpload",     imageUpload);

// ─── Doctor profile ──────────────────────────────────────────────────────────
router.get("/doctor/profile",  authMiddleware, getDoctorProfile);
router.put("/doctor/profile",  authMiddleware, updateDoctorProfile);

// ─── Patient profile ─────────────────────────────────────────────────────────
// authMiddleware = logged in?   loadPatient = is a patient, and which one?
const patientOnly = [authMiddleware, loadPatient];

router.get("/patient/profile",               patientOnly, getProfile);
router.put("/patient/profile",               patientOnly, updateProfile);
router.put("/patient/photo",                 patientOnly, updatePhoto);
router.get("/patient/records",               patientOnly, getRecords);

router.post(  "/patient/prescriptions",      patientOnly, addPrescription);
router.delete("/patient/prescriptions/:id",  patientOnly, deletePrescription);

router.post(  "/patient/test-reports",       patientOnly, addReport);
router.delete("/patient/test-reports/:id",   patientOnly, deleteReport);

router.post(  "/patient/bills",              patientOnly, addBill);
router.delete("/patient/bills/:id",          patientOnly, deleteBill);

module.exports = router
