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
const { queueAccess } = require("../middlewares/queueAccess");
const { resolveDoctor } = require("../middlewares/resolveDoctor");
const { searchDoctors: searchDoctorsForPatients, getDoctor: getDoctorForPatients } = require("../controllers/doctorSearchController");
const { checkout, confirm: confirmBooking, myBookings, cancelBooking } = require("../controllers/bookingController");
const { getPatientInfo } = require("../controllers/doctorPatientController");
const { listRecords, addRecord, deleteRecord } = require("../controllers/recordsController");
const {
  getQueue,
  getNowServing,
  addWalkIn,
  callNext,
  changeStatus,
  reschedule,
  getUpcoming,
  setFee,
} = require("../controllers/queueController");

// ─── Auth / general ──────────────────────────────────────────────────────────
router.get( "/me",              getMe);
router.post("/send-otp",        sendotp);
router.post("/verify-otp",      verifyotp);
router.post("/register/:role",  auth);
router.post("/login",           login);
router.post("/logout",          logout);
router.post("/googleregister",  verifyGoogleForRegistration);
router.post("/googlelogin",     loginWithGoogle);
router.put( "/imageUpload",     authMiddleware, imageUpload);

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

// ─── Patients: find a doctor and book (physical consultations) ───────────────
// :doctorId is the doctor's 6-digit ID
router.get("/doctors/search",                         patientOnly, searchDoctorsForPatients); // before /:doctorId
router.get("/doctors/:doctorId",                      [...patientOnly, resolveDoctor], getDoctorForPatients);
router.post("/patient/bookings/checkout",             patientOnly, checkout);
router.post("/patient/bookings/:paymentId/confirm",   patientOnly, confirmBooking);
router.get("/patient/bookings",                       patientOnly, myBookings);
router.post("/patient/bookings/:appointmentId/cancel", patientOnly, cancelBooking);

// ─── Queue (physical consultations) ──────────────────────────────────────────
// look: the doctor, or a receptionist assigned to that doctor     desk: assigned receptionist only
// :doctorId in the address is the doctor's 6-digit ID; resolveDoctor turns it into the database _id
const queueLook = [authMiddleware, resolveDoctor, queueAccess()];
const queueDesk = [authMiddleware, resolveDoctor, queueAccess({ write: true })];

router.get("/queue/:doctorId",                                queueLook, getQueue);
router.get("/queue/:doctorId/upcoming",                       queueLook, getUpcoming);
router.get("/queue/:doctorId/now",                            authMiddleware, resolveDoctor, getNowServing); // any logged-in user
router.get("/queue/:doctorId/appointments/:id/patient",       queueLook, getPatientInfo); // the doctor opens a patient
router.post("/queue/:doctorId/walk-in",                       queueDesk, addWalkIn);
router.post("/queue/:doctorId/next",                          queueDesk, callNext);
router.put("/queue/:doctorId/appointments/:id/status",        queueDesk, changeStatus);
router.put("/queue/:doctorId/appointments/:id/reschedule",    queueDesk, reschedule);
router.put("/queue/:doctorId/appointments/:id/fee",           queueDesk, setFee);

// Records of a visit: the receptionist uploads prescriptions, test reports and bills (kind = prescriptions | reports | bills)
router.get(   "/queue/:doctorId/appointments/:id/records",               queueDesk, listRecords);
router.post(  "/queue/:doctorId/appointments/:id/records/:kind",         queueDesk, addRecord);
router.delete("/queue/:doctorId/appointments/:id/records/:kind/:itemId", queueDesk, deleteRecord);

// ─── Live connection test (development only; remove when the queue is built) ──
// Sends a test message to every open browser tab of the logged-in user.
router.post("/socket/test", authMiddleware, (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(404).json({ success: false });

  const io = req.app.get("io");
  let sent = 0;
  for (const socket of io.sockets.sockets.values()) {
    if (socket.data.user?.accountId === req.user.accountId) {
      socket.emit("socket:test", { message: "Hello from the server", at: new Date().toISOString() });
      sent++;
    }
  }
  return res.status(200).json({ success: true, sent });
});

module.exports = router;
