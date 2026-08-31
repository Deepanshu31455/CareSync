const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");
const Patient=require('../models/Patient')

const getMe = async (req, res) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role=decoded.role;
    let m=null;
    // decoded.accountId
    if(role=="patient")
      m=Patient
    else if(role=="doctor")
      m=Doctor
    else if(role=="receptionist")
      m=Receptionist

    if(!m)
    {
        return res.status(404).json({
        success: false,
        message: "Invalid Role",
      });
    }
    const user = await m.findById(decoded.accountId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const dataforslice={
       id:user.id,
       name:user.fullName,
       email:user.email,
       role:user.role,
    }
    // Return logged-in user

    return res.status(200).json({
      success: true,
      dataforslice,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { getMe };