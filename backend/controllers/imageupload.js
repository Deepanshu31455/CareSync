const cloudinary = require("cloudinary").v2;

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Receptionist = require("../models/Receptionist");



async function uploadFileToCloudinary(file, folder) {
    const options = {
        folder: folder,
        resource_type: "auto",
    };

    const response = await cloudinary.uploader.upload(
        file.tempFilePath,
        options
    );
    return response;
}


exports.imageUpload = async (req, res) => {
  try {
    // Fetching data
    const { id, role } = req.body;

    const file = req.files.imageFile;

    // Validation
    const supportedFile = ["jpeg", "jpg", "png"];

    const fileType = file.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!supportedFile.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Not valid file format",
      });
    }

    // Upload image to Cloudinary
    const response = await uploadFileToCloudinary(
      file,
      "Deep"
    );

    console.log(response);

    // Select correct model
    let Model;

    if (role === "patient") {
      Model = Patient;
    } else if (role === "doctor") {
      Model = Doctor;
    } else if (role === "receptionist") {
      Model = Receptionist;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Find user
    const user = await Model.findOne({ id: id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update profile photo URL
    user.profilePhoto = response.secure_url;

    // Save updated user
    await user.save();

    return res.status(200).json({
      success: true,
      profilePhoto: response.secure_url,
      message: "Profile photo updated successfully",
    });

  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Something wrong happened",
    });
  }
};