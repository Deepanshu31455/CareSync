const mongoose = require("mongoose");

const Assignment = require("../models/Assignment");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");
const Patient = require("../models/Patient");

const { makeAccess } = require("./access");

// One shared instance with the real models. Used by the live connection (socket/index.js)
// and by the queue routes (middlewares/queueAccess.js), so both apply the same rules.
const access = makeAccess({
  Assignment,
  models: { doctor: Doctor, receptionist: Receptionist, patient: Patient },
  isValidObjectId: mongoose.isValidObjectId,
});

module.exports = { access };
