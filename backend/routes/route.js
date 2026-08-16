const express =require("express")
const router=express.Router();

//import controller
const {sendotp}=require("../controllers/sendotp");
const {verifyotp}=require("../controllers/verifyotp")
// const {saveuser}=require("../controllers/saveuser");

router.post("/send-otp",sendotp);
router.post("/verify-otp", verifyotp);
// router.post("/saveuser", saveuser);


module.exports=router;