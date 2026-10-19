import { Check, Clock, UserX, Video, X } from "lucide-react";

import { formatTimeIST } from "../../utils/dates";
import { VIDEO_STATUS } from "./constants";

const GENDER_LABEL = { male: "Male", female: "Female", other: "Other", "prefer-not-to-say": "" };

// One patient of the doctor's video queue. Click the name to open their information.
//   item      { visitId, tokenNumber, status, scheduledAt, ready, name, age, gender }
//   isToday   a call can be started only on the day
//   selected  this patient's information is open
//   working   the id (or "schedule") of the running action, or null
//   onSelect / onSetTime / onStart / onOpenCall / onComplete / onCancel / onNoShow  (item) => ...
export default function VideoRow({ item, isToday, selected, working, onSelect, onSetTime, onStart, onOpenCall, onComplete, onCancel, onNoShow }) {
  const status = VIDEO_STATUS[item.status] || VIDEO_STATUS.waiting;
  const waiting = item.status === "waiting";
  const inCall = item.status === "in_consultation";
  const busy = working !== null;
  const canStart = waiting && isToday && item.ready;

  const details = [item.age != null ? `${item.age} yrs` : null, GENDER_LABEL[item.gender] || null].filter(Boolean);

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border p-4 ${
        selected ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : inCall ? "border-green-300 bg-green-50/40" : item.ready && waiting ? "border-green-200 bg-white" : "border-slate-200 bg-white"
      }`}
    >
      <button onClick={() => onSelect(item)} aria-pressed={selected} className="flex items-center gap-4 text-left">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-serif text-xl font-bold text-white">
          {item.tokenNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-slate-900">{item.name}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
            {waiting && (
              <span
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  item.ready ? "border-green-300 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${item.ready ? "bg-green-500" : "bg-slate-300"}`} />
                {item.ready ? "Available now" : "Not available yet"}
              </span>
            )}
            {item.paymentStatus === "refund_pending" && (
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Refund due</span>
            )}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate-600">
            <span>{details.join(" · ")}</span>
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              {item.scheduledAt ? <span className="font-semibold text-slate-800">{formatTimeIST(item.scheduledAt)}</span> : <span className="text-slate-400">No time yet</span>}
            </span>
          </span>
        </span>
      </button>

      {(waiting || inCall) && (
        <div className="flex flex-wrap gap-2">
          {waiting && (
            <button
              onClick={() => onStart(item)}
              disabled={busy || !canStart}
              title={!isToday ? "A call can be started on the day of the visit" : !item.ready ? "Waiting for the patient to mark themselves available" : undefined}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Video size={14} /> Start call
            </button>
          )}
          {inCall && (
            <button
              onClick={() => onOpenCall(item)}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Video size={14} /> Open call
            </button>
          )}
          {inCall && (
            <button
              onClick={() => onComplete(item)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={14} /> End call
            </button>
          )}
          {waiting && (
            <button
              onClick={() => onSetTime(item)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <Clock size={14} /> {item.scheduledAt ? "Change time" : "Set time"}
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
