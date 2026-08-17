const express =require("express")
const router=express.Router();

//import controller
const {sendotp}=require("../controllers/sendotp");
const {verifyotp}=require("../controllers/verifyotp")
const {auth}=require("../controllers/auth");
const { login } = require("../controllers/login");

router.post("/send-otp",sendotp);
router.post("/verify-otp", verifyotp);
router.post("/register/:role", auth);
router.post("/login", login);



module.exports=router;