const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");

// Runs after authMiddleware (req.user = { accountId, role }).
// Lets only the given role through, and puts the logged-in account on req.account.
// accountId can be the MongoDB _id or the login ID; both work.
//   fields = optional list of fields to load (leave out to load everything)
function loadAccount(role, Model, fields) {
  return async (req, res, next) => {
    try {
      const { accountId, role: tokenRole } = req.user;

      if (tokenRole !== role) {
        return res.status(403).json({ success: false, message: `Only a ${role} can do this.` });
      }

      const query = mongoose.isValidObjectId(accountId) ? { _id: accountId } : { id: accountId };
      let find = Model.findOne(query);
      if (fields) find = find.select(fields);

      req.account = await find;
      if (!req.account) {
        return res.status(401).json({ success: false, message: "Account not found." });
      }
      next();
    } catch (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Something went wrong." });
    }
  };
}

module.exports = {
  loadReceptionist: loadAccount("receptionist", Receptionist),
  loadDoctor: loadAccount("doctor", Doctor, "fullName email"), // staff routes need only these
};
