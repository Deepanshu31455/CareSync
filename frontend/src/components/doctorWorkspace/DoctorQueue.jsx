import { STATUS, FINISHED } from "../queueDesk/constants";
import { EmptyState } from "../shared/ui";

const GENDER_LABEL = { male: "Male", female: "Female", other: "Other", "prefer-not-to-say": "" };

// One person in the doctor's queue. Click to open their information.
function Row({ item, selected, onSelect }) {
  const status = STATUS[item.status] || STATUS.waiting;
  const details = [
    item.age != null ? `${item.age} yrs` : null,
    GENDER_LABEL[item.gender] || null,
    item.source === "walk_in" ? "Walk-in" : "Booked online",
  ].filter(Boolean);

  return (
    <li>
      <button
        onClick={() => onSelect(item.appointmentId)}
        aria-pressed={selected}
        className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition ${
          selected ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:bg-slate-50"
        } ${item.status === "in_consultation" && !selected ? "border-green-300 bg-green-50/40" : ""}`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-serif text-lg font-bold text-white">
          {item.tokenNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900">{item.name}</span>
          <span className="block text-xs text-slate-500">{details.join(" · ")}</span>
        </span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
      </button>
    </li>
  );
}

// The doctor's queue for the day, read only (the receptionist runs it):
// the patient with the doctor first, then those waiting, finished ones folded away.
export default function DoctorQueue({ items, selectedId, onSelect }) {
  const inside = items.filter((i) => i.status === "in_consultation");
  const waiting = items.filter((i) => i.status === "waiting");
  const finished = items.filter((i) => FINISHED.includes(i.status));

  if (items.length === 0) return <EmptyState text="No one is in the queue yet. Patients appear here as they book or are added at the desk." />;

  return (
    <div className="space-y-4">
      {inside.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">With you now</h3>
          <ul className="space-y-2">
            {inside.map((item) => (
              <Row key={item.appointmentId} item={item} selected={item.appointmentId === selectedId} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Waiting ({waiting.length})</h3>
        {waiting.length === 0 ? (
          <p className="text-sm text-slate-400">No one is waiting.</p>
        ) : (
          <ul className="space-y-2">
            {waiting.map((item) => (
              <Row key={item.appointmentId} item={item} selected={item.appointmentId === selectedId} onSelect={onSelect} />
            ))}
          </ul>
        )}
      </section>

      {finished.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Finished ({finished.length})</summary>
          <ul className="mt-3 space-y-2">
            {finished.map((item) => (
              <Row key={item.appointmentId} item={item} selected={item.appointmentId === selectedId} onSelect={onSelect} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
