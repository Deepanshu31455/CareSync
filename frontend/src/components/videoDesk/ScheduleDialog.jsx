import { useEffect, useState } from "react";

import { Field } from "../shared/ui";
import { inputClass } from "../shared/constants";
import { formatDay, todayIST } from "../../utils/dates";

const clockText = (minutesFromMidnight) => {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const period = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${period}`;
};

// Gives times to all the waiting patients of a day at once, in token order:
// the first gets the start time, the next one "minutes" later, and so on. Indian time.
//   date      the day shown          waiting   the waiting patients of that day [{ scheduledAt }]
//   busy / error   from the request   onSubmit({ date, start, minutes, onlyUnscheduled })   onCancel()
export default function ScheduleDialog({ date, waiting, busy, error, onSubmit, onCancel }) {
  const [start, setStart] = useState("17:00");
  const [minutes, setMinutes] = useState(10);
  const [onlyUnscheduled, setOnlyUnscheduled] = useState(true);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const count = onlyUnscheduled ? waiting.filter((w) => !w.scheduledAt).length : waiting.length;
  const validStart = /^([01]\d|2[0-3]):[0-5]\d$/.test(start);
  const validMinutes = Number.isInteger(Number(minutes)) && Number(minutes) >= 5 && Number(minutes) <= 60;

  let preview = "";
  if (validStart && validMinutes && count > 0) {
    const first = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
    const last = first + (count - 1) * Number(minutes);
    preview =
      last >= 24 * 60
        ? "There is not enough room in the day. Start earlier or use fewer minutes."
        : `${count} ${count === 1 ? "patient" : "patients"}: from ${clockText(first)}${count > 1 ? ` to ${clockText(last)}` : ""}`;
  } else if (count === 0) {
    preview = onlyUnscheduled ? "Everyone waiting already has a time." : "No one is waiting.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && onCancel()} role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg font-semibold text-slate-900">Give times to the waiting patients</h3>
        <p className="mt-2 text-sm text-slate-600">
          {formatDay(date)}
          {date === todayIST() ? " (today)" : ""}. Patients are timed in token order, one after another.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="First patient at">
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Minutes each">
            <input type="number" min={5} max={60} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={onlyUnscheduled} onChange={(e) => setOnlyUnscheduled(e.target.checked)} />
          Only patients who have no time yet
        </label>

        {preview && <p className="mt-3 rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{preview}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ date, start, minutes: Number(minutes), onlyUnscheduled })}
            disabled={busy || !validStart || !validMinutes || count === 0}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Give times"}
          </button>
        </div>
      </div>
    </div>
  );
}
