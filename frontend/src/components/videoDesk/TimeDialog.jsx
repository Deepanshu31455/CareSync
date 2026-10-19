import { useEffect, useState } from "react";

import { Field } from "../shared/ui";
import { inputClass } from "../shared/constants";
import { clockOfIST, todayIST } from "../../utils/dates";

// A quarter-hour from now, in Indian time, as "HH:MM" (never past midnight)
function soon() {
  const next = new Date(Math.ceil((Date.now() + 10 * 60 * 1000) / (15 * 60 * 1000)) * 15 * 60 * 1000);
  return clockOfIST(next);
}

// The time the doctor gives ONE patient. Indian time.
//   item   the patient (name, token, date, scheduledAt)      isToday   the day shown is today
//   busy / error   from the request      onSave(time)   onClear()   onCancel()
export default function TimeDialog({ item, isToday, busy, error, onSave, onClear, onCancel }) {
  const [time, setTime] = useState(item.scheduledAt ? clockOfIST(item.scheduledAt) : isToday ? soon() : "17:00");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && onCancel()} role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg font-semibold text-slate-900">Time for {item.name}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Token {item.tokenNumber}. The patient sees this time and can mark themselves available from 15 minutes before it.
        </p>

        <div className="mt-4">
          <Field label="Time (Indian time)">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </Field>
          {isToday && <p className="mt-1 text-xs text-slate-400">Today is {todayIST()}. A time that has passed is not accepted.</p>}
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          {item.scheduledAt ? (
            <button onClick={onClear} disabled={busy} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
              Clear time
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onCancel} disabled={busy} className="rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => onSave(time)} disabled={busy || !valid} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? "Saving..." : "Save time"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
