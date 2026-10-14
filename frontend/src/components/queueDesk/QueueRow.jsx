import { CalendarClock, Check, FileText, Phone, PhoneCall, UserX, X } from "lucide-react";
import { STATUS } from "./constants";
import { RECORD_STATUSES } from "../records/constants";

const GENDER_LABEL = { male: "Male", female: "Female", other: "Other", "prefer-not-to-say": "" };

// One person in the queue: token, details and the buttons that make sense for their status.
//   item   { appointmentId, tokenNumber, status, source, paymentStatus, name, age, gender, phone? }
//   isToday        calling and no-show are for today's patients only
//   someoneInside  true while another patient is with the doctor ("Call in" waits for them)
//   working        which action is running (disables the buttons)
//   onStart / onComplete / onCancel / onNoShow / onReschedule  (item) => ...
//   onRecords      (item) => ...  opens the tests, reports and bills of an app patient (also after the visit)
export default function QueueRow({ item, isToday, someoneInside, working, onStart, onComplete, onCancel, onNoShow, onReschedule, onRecords }) {
  const status = STATUS[item.status] || STATUS.waiting;
  const inside = item.status === "in_consultation";
  const waiting = item.status === "waiting";
  const busy = working !== null;
  const canRecords = Boolean(onRecords) && item.source === "online" && RECORD_STATUSES.includes(item.status);

  const details = [
    item.age != null ? `${item.age} yrs` : null,
    GENDER_LABEL[item.gender] || null,
    item.source === "walk_in" ? "Walk-in" : "App booking",
  ].filter(Boolean);

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        inside ? "border-green-300 bg-green-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-serif text-xl font-bold text-white">
          {item.tokenNumber}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{item.name}</p>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
            {item.paymentStatus === "refund_pending" && (
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                Refund due
              </span>
            )}
            {item.paymentStatus === "pending" && !inside && item.status !== "cancelled" && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Fee pending
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-600">{details.join(" · ")}</p>
          {item.phone && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Phone size={12} /> {item.phone}
            </p>
          )}
        </div>
      </div>

      {(waiting || inside || canRecords) && (
        <div className="flex flex-wrap gap-2">
          {canRecords && (
            <button
              onClick={() => onRecords(item)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              <FileText size={14} /> Records
            </button>
          )}
          {waiting && isToday && (
            <button
              onClick={() => onStart(item)}
              disabled={busy || someoneInside}
              title={someoneInside ? "Complete the current patient first" : undefined}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PhoneCall size={14} /> Call in
            </button>
          )}
          {inside && (
            <button
              onClick={() => onComplete(item)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={14} /> Complete
            </button>
          )}
          {(waiting || inside) && (
          <button
            onClick={() => onReschedule(item)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <CalendarClock size={14} /> Reschedule
          </button>
          )}
          {waiting && isToday && (
            <button
              onClick={() => onNoShow(item)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <UserX size={14} /> No-show
            </button>
          )}
          {waiting && (
            <button
              onClick={() => onCancel(item)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>
      )}
    </li>
  );
}
