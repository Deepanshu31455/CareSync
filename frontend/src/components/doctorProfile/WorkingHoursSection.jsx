import { Clock } from "lucide-react";
import { inputClass } from "./constants";
import { Section } from "./ui";
import { TIME_OPTIONS, parseTimeRange } from "./timeUtils";

function OpenClosedToggle({ closed, onChange }) {
  const base = "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition";

  return (
    <div className="flex gap-1 rounded-xl bg-gray-200 p-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`${base} ${
          !closed ? "bg-green-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        Open
      </button>

      <button
        type="button"
        onClick={() => onChange(true)}
        className={`${base} ${
          closed ? "bg-gray-700 text-white shadow" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        Closed
      </button>
    </div>
  );
}

function TimeSelect({ label, value, onChange }) {
  return (
    <label className="block flex-1 space-y-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {TIME_OPTIONS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditableDay({ slot, onChange }) {
  const { start, end } = parseTimeRange(slot.time);

  return (
    <div className="space-y-3">
      <p className="font-semibold text-gray-800">{slot.day}</p>

      <OpenClosedToggle
        closed={slot.isClosed}
        onChange={(closed) => onChange({ isClosed: closed })}
      />

      {slot.isClosed ? (
        <p className="text-sm text-gray-500">Not available on this day.</p>
      ) : (
        <div className="flex gap-2">
          <TimeSelect label="From" value={start} onChange={(v) => onChange({ start: v })} />
          <TimeSelect label="To" value={end} onChange={(v) => onChange({ end: v })} />
        </div>
      )}
    </div>
  );
}

function ReadOnlyDay({ slot }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-800">{slot.day}</p>
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            slot.isClosed ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700"
          }`}
        >
          {slot.isClosed ? "Closed" : "Open"}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{slot.time}</p>
    </>
  );
}

export default function WorkingHoursSection({ d, editing, onChangeDay }) {
  return (
    <Section title="Working Days & Hours" icon={Clock}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {d.workingHours.map((slot, index) => (
          <div
            key={slot.day}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            {editing ? (
              <EditableDay slot={slot} onChange={(changes) => onChangeDay(index, changes)} />
            ) : (
              <ReadOnlyDay slot={slot} />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
