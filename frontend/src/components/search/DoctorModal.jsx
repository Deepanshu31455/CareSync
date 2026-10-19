import { useEffect, useState } from "react";
import { CheckCircle2, IndianRupee, MapPin, Video, X } from "lucide-react";

import useDoctorBooking from "../../hooks/useDoctorBooking";
import { Avatar, ErrorState, Messages } from "../shared/ui";
import { formatMoney } from "../shared/helpers";
import { formatDay, todayIST } from "../../utils/dates";

const listText = (value) => (Array.isArray(value) ? value.join(", ") : value || "");

// The doctor's directions are saved as { instructions, landmark, mapLink }: only text, no empty parts
function directionsText(directions) {
  if (!directions) return "";
  if (typeof directions === "string") return directions;
  return [directions.instructions, directions.landmark && `Landmark: ${directions.landmark}`].filter(Boolean).join(". ");
}

// The doctor's page with the booking steps, in a window:
//   details + choose a day  ->  payment  ->  your token
//   doctorId  the doctor's 6-digit ID      firstDate  the day chosen in the search
//   onBooked  runs after a booking succeeded (the page reloads the patient's bookings)
export default function DoctorModal({ doctorId, firstDate, onClose, onBooked }) {
  const { doctor, days, today, loading, working, error, setError, reload, startPayment, pay } = useDoctorBooking(doctorId);

  const [step, setStep] = useState("choose"); // "choose" | "pay" | "done"
  const [type, setType] = useState("physical"); // "physical" (visit the clinic) | "video"
  const [date, setDate] = useState(firstDate);
  const [checkout, setCheckout] = useState(null); // { mode, payment }
  const [booking, setBooking] = useState(null);

  // A clinic visit needs the doctor's hours to be still running today; a video visit needs only a working day
  const isOpen = (d) => (type === "video" ? Boolean(d.videoOpen) : d.open);

  // Esc closes the window (not while a payment is running)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !working && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [working, onClose]);

  // If the day chosen in the search is not bookable, start with the first day that is
  useEffect(() => {
    if (days.length > 0 && !days.some((d) => d.date === date && isOpen(d))) {
      const first = days.find((d) => isOpen(d));
      if (first) setDate(first.date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, date, type]);

  async function goToPayment() {
    const result = await startPayment(date, type);
    if (result) {
      setCheckout(result);
      setStep("pay");
    }
  }

  async function payNow() {
    const result = await pay(checkout.payment.id, type);
    if (result) {
      setBooking(result);
      setStep("done");
      onBooked(type);
    }
  }

  const fee = doctor?.consultationFee || 0;
  const isToday = date === todayIST();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={() => !working && onClose()} role="dialog" aria-modal="true">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex justify-end">
          <button onClick={onClose} disabled={working} aria-label="Close" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {!loading && !doctor && <ErrorState text={error || "Could not load the doctor."} onRetry={reload} />}

        {!loading && doctor && (
          <>
            {/* Who the doctor is */}
            <div className="flex items-start gap-4">
              <Avatar src={doctor.profilePhoto} name={doctor.fullName} className="h-20 w-20 text-3xl" />
              <div className="min-w-0">
                <h2 className="font-serif text-2xl font-semibold text-slate-900">Dr. {doctor.fullName}</h2>
                <p className="text-sm text-slate-600">
                  {doctor.specialization}
                  {doctor.qualifications ? ` · ${doctor.qualifications}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {doctor.experience > 0 ? `${doctor.experience} yrs experience` : ""}
                  {doctor.affiliation ? ` · ${doctor.affiliation}` : ""}
                </p>
                {doctor.clinicAddress && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} /> {doctor.clinicAddress}
                  </p>
                )}
              </div>
            </div>

            {step === "choose" && (
              <>
                {(doctor.otherDescription || listText(doctor.facilities) || directionsText(doctor.directions)) && (
                  <div className="mt-5 space-y-2 text-sm text-slate-600">
                    {doctor.otherDescription && <p>{doctor.otherDescription}</p>}
                    {listText(doctor.facilities) && (
                      <p>
                        <span className="font-semibold text-slate-700">Facilities: </span>
                        {listText(doctor.facilities)}
                      </p>
                    )}
                    {directionsText(doctor.directions) && (
                      <p>
                        <span className="font-semibold text-slate-700">How to reach: </span>
                        {directionsText(doctor.directions)}
                        {doctor.directions?.mapLink && (
                          <>
                            {" "}
                            <a href={doctor.directions.mapLink} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                              Open map
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {type === "physical" && today && date === today.date && (
                  <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    Today: {today.nowServing ? `now serving ${today.nowServing}` : "not started yet"} · {today.waiting} waiting
                  </p>
                )}

                {/* The day */}
                <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Choose a day</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {days.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => setDate(d.date)}
                      disabled={!isOpen(d)}
                      aria-pressed={date === d.date}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        date === d.date
                          ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                          : isOpen(d)
                          ? "border-slate-200 hover:bg-slate-50"
                          : "cursor-not-allowed border-slate-100 text-slate-300"
                      }`}
                    >
                      {formatDay(d.date)}
                    </button>
                  ))}
                </div>
                {!days.some((d) => isOpen(d)) && (
                  <p className="mt-2 text-sm text-slate-500">This doctor has no consulting days in the next 7 days.</p>
                )}

                {/* The kind of consultation */}
                <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Consultation</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setType("physical")}
                    aria-pressed={type === "physical"}
                    className={`rounded-xl border p-3 text-left text-sm font-semibold ${
                      type === "physical" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Visit the clinic
                    <p className="text-xs font-normal opacity-80">Physical consultation</p>
                  </button>
                  <button
                    onClick={() => setType("video")}
                    aria-pressed={type === "video"}
                    className={`rounded-xl border p-3 text-left text-sm font-semibold ${
                      type === "video" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Video size={14} /> Video
                    </span>
                    <p className="text-xs font-normal opacity-80">The doctor will give you a time</p>
                  </button>
                </div>

                <div className="mt-6">
                  <Messages error={error} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1 text-lg font-semibold text-slate-900">
                    <IndianRupee size={16} /> {fee > 0 ? formatMoney(fee) : "Free"}
                  </p>
                  <button
                    onClick={goToPayment}
                    disabled={working || !days.some((d) => d.date === date && isOpen(d))}
                    className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {working ? "Please wait..." : "Continue to payment"}
                  </button>
                </div>
              </>
            )}

            {step === "pay" && checkout && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-200 p-4 text-sm">
                  <p className="font-semibold text-slate-900">Booking summary</p>
                  <p className="mt-2 text-slate-600">
                    Dr. {doctor.fullName} · {formatDay(date)}
                    {isToday ? " (today)" : ""} · {type === "video" ? "Video consultation" : "Physical consultation"}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {checkout.payment.amount > 0 ? formatMoney(checkout.payment.amount) : "Free"}
                  </p>
                </div>

                {checkout.mode === "demo" ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Demo payment: no real money is charged. A real payment gateway will be added later.
                  </p>
                ) : (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Online payment is not set up yet.
                  </p>
                )}

                <Messages error={error} />

                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => {
                      setError(null);
                      setStep("choose");
                    }}
                    disabled={working}
                    className="rounded-full border border-slate-200 px-5 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={payNow}
                    disabled={working || checkout.mode !== "demo"}
                    className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {working ? "Processing..." : checkout.payment.amount > 0 ? `Pay ${formatMoney(checkout.payment.amount)}` : "Confirm booking"}
                  </button>
                </div>
              </div>
            )}

            {step === "done" && booking && (
              <div className="mt-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 size={44} className="text-green-600" />
                <h3 className="font-serif text-xl font-semibold text-slate-900">You are booked</h3>
                <p className="text-sm text-slate-600">
                  {formatDay(booking.date)} · Dr. {booking.doctor.fullName}
                </p>
                <p className="font-serif text-6xl font-bold text-slate-900">{booking.tokenNumber}</p>
                <p className="text-sm text-slate-500">
                  {type === "video" ? "Your video token" : "Your token number"}
                  {booking.date === todayIST()
                    ? booking.peopleAhead > 0
                      ? ` · ${booking.peopleAhead} ${booking.peopleAhead === 1 ? "person is" : "people are"} ahead of you`
                      : " · you are next"
                    : ""}
                </p>
                <p className="text-xs text-slate-400">
                  {type === "video"
                    ? "The doctor will set your time. You will see it under \"My video visits\" at the top of the search page, and mark yourself available when it is time."
                    : "You can follow the queue live at the top of the search page."}
                </p>
                <button onClick={onClose} className="mt-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  Done
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
