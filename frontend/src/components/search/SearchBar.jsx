import { CalendarDays, Search } from "lucide-react";
import { inputClass } from "../shared/constants";

// The search box, the day and the "only doctors consulting that day" switch.
//   date must be between `min` (today) and `max` (two weeks ahead)
export default function SearchBar({ text, onText, date, onDate, min, max, consultingOnly, onConsultingOnly }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder="Search by doctor's name or specialization"
            className={`${inputClass} pl-9`}
            aria-label="Search doctors"
          />
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-slate-400" />
          <input
            type="date"
            value={date}
            min={min}
            max={max}
            onChange={(e) => e.target.value && onDate(e.target.value)}
            className={`${inputClass} w-auto`}
            aria-label="Consultation day"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consultingOnly}
          onChange={(e) => onConsultingOnly(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Only doctors consulting on this day
      </label>
    </div>
  );
}
