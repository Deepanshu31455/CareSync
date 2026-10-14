import { useEffect, useState } from "react";

import { Field } from "../shared/ui";
import { inputClass } from "../shared/constants";
import { addDays, formatDay, todayIST } from "../../utils/dates";

// Moves a patient to another day, for example when a test has to be done first.
// They get a NEW token on that day. Choosing today puts them at the end of today's queue.
//   item     the patient (name and token are shown)
//   busy     true while the request runs      error  message from the server, shown in the box
//   onConfirm(date)  /  onCancel()
export default function RescheduleDialog({ item, busy, error, onConfirm, onCancel }) {
  const today = todayIST();
  const [date, setDate] = useState(addDays(today, 1));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const valid = date >= today;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg font-semibold text-slate-900">Reschedule {item.name}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Token {item.tokenNumber} will be closed. {item.name} gets a new token on the day you choose.
        </p>

        <div className="mt-4 space-y-3">
          <Field label="New day">
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="flex gap-2">
            <button
              onClick={() => setDate(today)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"
            >
              Later today (end of queue)
            </button>
            <button
              onClick={() => setDate(addDays(today, 1))}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"
            >
              Tomorrow
            </button>
          </div>
          {valid && <p className="text-xs text-slate-500">New token on {formatDay(date)}.</p>}
          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(date)}
            disabled={busy || !valid}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Please wait..." : "Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
