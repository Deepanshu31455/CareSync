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
const {
  getProfile: getReceptionistProfile,
  updateProfile: updateReceptionistProfile,
  updatePhoto: updateReceptionistPhoto,
} = require("../controllers/receptionistController");
const {
  listForReceptionist,
  searchDoctors,
  sendRequest,
  cancelRequest,
  removeDoctor,
  listForDoctor,
  respondInApp,
  removeReceptionist,
  previewByToken,
  respondByToken,
} = require("../controllers/assignmentController");

// middleware
const { authMiddleware } = require("../middlewares/authMiddleware");
const { loadPatient }    = require("../middlewares/loadPatient");
const { loadReceptionist, loadDoctor } = require("../middlewares/loadAccount");

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

// ─── Receptionist profile ────────────────────────────────────────────────────
const receptionistOnly = [authMiddleware, loadReceptionist];

router.get("/receptionist/profile",          receptionistOnly, getReceptionistProfile);
router.put("/receptionist/profile",          receptionistOnly, updateReceptionistProfile);
router.put("/receptionist/photo",            receptionistOnly, updateReceptionistPhoto);

// Serving doctors: connected ones, search, and email-confirmed requests
router.get(   "/receptionist/doctors",         receptionistOnly, listForReceptionist);
router.get(   "/receptionist/doctors/search",  receptionistOnly, searchDoctors); // before /:id
router.delete("/receptionist/doctors/:id",     receptionistOnly, removeDoctor);
router.post(  "/receptionist/requests",        receptionistOnly, sendRequest);
router.delete("/receptionist/requests/:id",    receptionistOnly, cancelRequest);

// ─── Doctor side of the assignment ───────────────────────────────────────────
const doctorOnly = [authMiddleware, loadDoctor];

router.get(   "/doctor/staff",         doctorOnly, listForDoctor);
router.put(   "/doctor/requests/:id",  doctorOnly, respondInApp);
router.delete("/doctor/staff/:id",     doctorOnly, removeReceptionist);

// ─── Emailed link (public: the secret token is the credential) ───────────────
router.get( "/assignments/preview", previewByToken);
router.post("/assignments/respond", respondByToken);

module.exports = router;
