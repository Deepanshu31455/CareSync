const { access } = require("../socket/identity");

// Runs on every /queue/:doctorId route, right after authMiddleware.
// The address carries the doctor's 6-digit ID; this swaps it for the database _id,
// so the controllers and the access check below work with one kind of id only.
async function resolveDoctor(req, res, next) {
  try {
    const doctorId = await access.resolveDoctorId(req.params.doctorId);
    if (!doctorId) return res.status(404).json({ success: false, message: "Doctor not found." });

    req.params.doctorId = doctorId;
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
}

module.exports = { resolveDoctor };
