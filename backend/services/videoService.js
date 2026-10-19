const VideoVisit = require("../models/VideoVisit");
const VideoDayCounter = require("../models/VideoDayCounter");
const Payment = require("../models/Payment");
const { endOfDatePlusDays } = require("../utils/dates");
const { emitToUser } = require("../socket/emitter");
const { isDuplicate } = require("./queueService");

// The logic of video visits, shared by the patient's routes and the doctor's routes.
// Video visits have their OWN queue and token counter (separate from the clinic queue).

const COUNTER_KEEP_DAYS = 3;
const ACTIVE = ["waiting", "in_consultation"];
// A patient may mark themselves available from this many minutes before the time the doctor gave
const EARLY_MINUTES = 15;

// The next video token for a doctor on a date. One atomic update.
async function nextVideoToken(doctor, date) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const counter = await VideoDayCounter.findOneAndUpdate(
        { doctor, date },
        { $inc: { lastToken: 1 }, $setOnInsert: { expireAt: endOfDatePlusDays(date, COUNTER_KEEP_DAYS) } },
        { upsert: true, new: true }
      );
      return counter.lastToken;
    } catch (err) {
      if (!isDuplicate(err) || attempt === 2) throw err;
    }
  }
}

// data = { doctor, patient, date, paymentRef }
async function createVideoVisit(data) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const tokenNumber = await nextVideoToken(data.doctor, data.date);
    try {
      return await VideoVisit.create({ ...data, tokenNumber, paymentStatus: "paid" });
    } catch (err) {
      if (!isDuplicate(err) || attempt === 2) throw err;
    }
  }
}

// Tells the doctor's and the patient's open screens that something changed. They load the list again
// (it is short), so a missed message can never leave a screen wrong.
//   visit = { doctor, patient, date }     skipDoctor: true when the doctor was told already (batch changes)
function publishVideoChange(io, visit, { skipDoctor = false } = {}) {
  if (!io || !visit) return;
  const message = { date: visit.date };
  if (!skipDoctor) emitToUser(io, String(visit.doctor), "video:changed", message);
  emitToUser(io, String(visit.patient), "video:changed", message);
}

// Cancels a visit that is still WAITING. A paid visit becomes "refund_pending" (the clinic returns the money).
// Used by the patient's cancel and the doctor's cancel. Returns { cancelled, refund }; cancelled is null when nothing matched.
async function cancelVideoWaiting(filter) {
  const cancelled = await VideoVisit.findOneAndUpdate(
    { ...filter, status: "waiting" },
    { status: "cancelled", paymentStatus: "refund_pending", $unset: { readyAt: 1 } },
    { new: true }
  );
  if (!cancelled) return { cancelled: null, refund: false };

  if (cancelled.paymentRef) {
    await Payment.updateOne({ _id: cancelled.paymentRef, status: "paid" }, { status: "refund_pending" }).catch(() => {});
  }
  return { cancelled, refund: true };
}

// The doctor ended the call: tell the room and take everyone out of it
function endCallRoom(io, visitId) {
  if (!io) return;
  const room = `call:${visitId}`;
  io.to(room).emit("call:ended", {});
  io.in(room).socketsLeave(room);
}

module.exports = { endCallRoom, ACTIVE, EARLY_MINUTES, nextVideoToken, createVideoVisit, publishVideoChange, cancelVideoWaiting };
