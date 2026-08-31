const express =require("express")
const router=express.Router();

//import controller
const {sendotp}=require("../controllers/sendotp");
const {verifyotp}=require("../controllers/verifyotp")
const {auth}=require("../controllers/auth");
const { login } = require("../controllers/login");
const { logout } = require("../controllers/logout");
const {getMe}=require("../controllers/auththroughcookie")
const {verifyGoogleForRegistration,loginWithGoogle}=require("../controllers/googleauth")
const {imageUpload}=require("../controllers/imageupload")


router.get("/me", (req, res, next) => { console.log("HIT /me"); next(); }, getMe);
router.post("/send-otp",sendotp);
router.post("/verify-otp", verifyotp);
router.post("/register/:role", auth);
router.post("/login", login);
router.post("/logout",logout);
router.post("/googleregister",verifyGoogleForRegistration)
router.post("/googlelogin",loginWithGoogle)
router.put("/imageUpload",imageUpload);


module.exports=router;