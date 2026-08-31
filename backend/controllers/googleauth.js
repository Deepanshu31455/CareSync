const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");

const { signToken, setAuthCookie } = require("../utils/jwt");

const verifyGoogleForRegistration = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      sub,
      email,
      email_verified,
      name,
      picture,
    } = payload;

    if (!email_verified) {
      return res.status(400).json({
        message: "Google email is not verified",
      });
    }

    return res.status(200).json({
      message: "Google verification successful",

      googleUser: {
        googleId: sub,
        email,
        name,
        picture,
        emailVerified: email_verified,
      },
    });

  } catch (error) {
    console.error("Google verification error:", error);

    return res.status(401).json({
      message: "Invalid Google credential",
    });
  }
};



const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    // 1. Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      sub: googleId,
      email,
      email_verified,
    } = payload;

    // 2. Verify email
    if (!email_verified) {
      return res.status(400).json({
        message: "Google email is not verified",
      });
    }

    // 3. Find account
    let user = null;
    let role = null;

    user = await Patient.findOne({ email });

    if (user) {
      role = "patient";
    }

    if (!user) {
      user = await Doctor.findOne({ email });

      if (user) {
        role = "doctor";
      }
    }

    if (!user) {
      user = await Receptionist.findOne({ email });

      if (user) {
        role = "receptionist";
      }
    }

    // 4. Account doesn't exist
    if (!user) {
      return res.status(404).json({
        message:
          "No account exists with this Google email. Please register first.",
      });
    }

    // 5. Create your JWT
    const token = signToken({
      accountId: user._id,
      role,
    });

    // 6. Store JWT in HTTP-only cookie
    setAuthCookie(res, token);

    // 7. Send response
    return res.status(200).json({
      message: "Google login successful",

      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role,
        profilePhoto:user.profilePhoto
      },
    });

  } catch (error) {

    console.error("Google login error:", error);

    return res.status(401).json({
      message: "Google authentication failed",
    });
  }
};


module.exports = {
  verifyGoogleForRegistration,loginWithGoogle
};