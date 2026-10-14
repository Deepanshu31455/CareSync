import { Clock, IndianRupee, MapPin, Star } from "lucide-react";

import { Avatar } from "../shared/ui";
import { formatMoney } from "../shared/helpers";
import { formatDay } from "../../utils/dates";

// One search result.
//   doctor  { id, fullName, specialization, qualifications, experience, consultationFee, clinicAddress,
//             profilePhoto, rating, totalRatings, consultingDays, date, open, queue }
//   today   "2026-10-13" (the queue is live only for today)
// The doctor can be opened only when they consult on the chosen day.
export default function DoctorCard({ doctor, today, onOpen }) {
  const isToday = doctor.date === today;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <Avatar src={doctor.profilePhoto} name={doctor.fullName} className="h-16 w-16 text-2xl" />

        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-semibold text-slate-900">Dr. {doctor.fullName}</p>
          <p className="text-sm text-slate-600">
            {doctor.specialization}
            {doctor.qualifications ? ` · ${doctor.qualifications}` : ""}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {doctor.experience > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {doctor.experience} yrs experience
              </span>
            )}
            {doctor.totalRatings > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-amber-500" /> {Number(doctor.rating).toFixed(1)} ({doctor.totalRatings})
              </span>
            )}
            {doctor.consultationFee > 0 && (
              <span className="flex items-center gap-1">
                <IndianRupee size={12} /> {formatMoney(doctor.consultationFee)}
              </span>
            )}
            {doctor.clinicAddress && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> <span className="truncate">{doctor.clinicAddress}</span>
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {doctor.open ? (
              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700">
                Consulting {isToday ? "today" : formatDay(doctor.date)}
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-500">
                Not consulting {isToday ? "today" : formatDay(doctor.date)}
              </span>
            )}

            {doctor.open && doctor.queue && isToday && (
              <span className="text-slate-500">
                {doctor.queue.nowServing ? `Now serving ${doctor.queue.nowServing}` : "Not started yet"} · {doctor.queue.waiting} waiting
              </span>
            )}
            {doctor.open && doctor.queue && !isToday && (
              <span className="text-slate-500">{doctor.queue.waiting} booked</span>
            )}
            {!doctor.open && doctor.consultingDays.length > 0 && (
              <span className="text-slate-400">Consults on {doctor.consultingDays.map((d) => d.slice(0, 3)).join(", ")}</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onOpen(doctor)}
        disabled={!doctor.open}
        className="shrink-0 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        {doctor.open ? "View & book" : "Not available"}
      </button>
    </li>
  );
}
