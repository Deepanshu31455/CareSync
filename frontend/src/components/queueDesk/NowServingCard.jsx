import { PhoneCall } from "lucide-react";
import { Card } from "../shared/ui";
import { CONNECTION } from "./constants";

// The big number: who is with the doctor now, how many wait, and the "Call next" button.
//   nowServing   token number inside, or null
//   canCall      false when the day is not today (calling is for today only)
//   readOnly     true on the doctor's screen: the receptionist calls patients, the doctor only watches
export default function NowServingCard({ nowServing, waiting, connection, canCall, working, onCallNext, readOnly = false }) {
  const status = CONNECTION[connection] || CONNECTION.connecting;

  let hint = "";
  if (!canCall) hint = "Calling patients is only possible for today.";
  else if (nowServing) hint = "Complete the current patient to call the next one.";
  else if (waiting === 0) hint = "No one is waiting.";

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Now serving</h2>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${status.className}`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.label}
        </span>
      </div>

      <p className="mt-3 text-center font-serif text-6xl font-bold text-slate-900" aria-live="polite">
        {nowServing ?? "—"}
      </p>
      <p className="mt-1 text-center text-sm text-slate-500">
        {waiting} waiting
      </p>

      {!readOnly && (
      <button
        onClick={onCallNext}
        disabled={!canCall || nowServing !== null || waiting === 0 || working !== null}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PhoneCall size={16} /> {working === "next" ? "Calling..." : "Call next patient"}
      </button>
      )}
      {!readOnly && hint && <p className="mt-2 text-center text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
