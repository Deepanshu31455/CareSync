const mongoose = require("mongoose");
const { access } = require("../socket/identity");

// Runs after authMiddleware on the /queue/:doctorId routes.
//   write: false  the doctor or an assigned receptionist may look at the queue
//   write: true   only an assigned receptionist may change it (add, call, complete, reschedule)
// Puts { role, userId } on req.staff.
function queueAccess({ write = false } = {}) {
  return async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      if (!mongoose.isValidObjectId(doctorId)) {
        return res.status(404).json({ success: false, message: "Doctor not found." });
      }

      const staff = await access.staffAccess(req.user, doctorId);
      if (!staff) {
        return res.status(403).json({ success: false, message: "You do not have access to this queue." });
      }
      if (write && staff.role !== "receptionist") {
        return res.status(403).json({ success: false, message: "Only the receptionist can change the queue." });
      }

      req.staff = staff;
      next();
    } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Something went wrong." });
    }
  };
}

module.exports = { queueAccess };
