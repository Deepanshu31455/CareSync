import { CalendarDays } from "lucide-react";
import { formatDay } from "../../utils/dates";

// A small line of counts for the coming days: "Fri 16 Oct · 3 patients". Nothing else is shown.
//   days      [{ date, count }]
//   onPick    optional (date) => ...  makes each day a button (the receptionist can open that day)
//   selected  the day currently open (highlighted)
export default function UpcomingDays({ days, onPick, selected }) {
  if (!days || days.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-slate-500">
        <CalendarDays size={15} /> Coming days
      </span>
      {days.map(({ date, count }) => {
        const label = `${formatDay(date)} · ${count} ${count === 1 ? "patient" : "patients"}`;
        const style = `rounded-full border px-3 py-1 ${
          selected === date ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"
        }`;
        return onPick ? (
          <button key={date} onClick={() => onPick(date)} className={`${style} hover:bg-slate-50`}>
            {label}
          </button>
        ) : (
          <span key={date} className={style}>
            {label}
          </span>
        );
      })}
    </div>
  );
}
