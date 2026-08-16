import { STEP_LABELS } from "./RegisterPage_constants";

export default function Stepper({ steps, current, role }) {
  return (
    <ol className="flex items-center justify-between gap-1.5">
      {steps.map((key, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        const label = key === "details" && role ? `${role.label} details` : STEP_LABELS[key];
        return (
          <li key={key} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-center">
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full font-mono text-[0.74rem] shrink-0 transition-colors ${
                  state === "done"
                    ? "bg-brand-teal text-white"
                    : state === "active"
                    ? "bg-brand-blue text-white"
                    : "bg-surfacealt text-inkfaint border border-border"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              {i < steps.length - 1 && (
                <span className={`h-[2px] flex-1 mx-1 ${i < current ? "bg-brand-teal" : "bg-border"}`} />
              )}
            </div>
            <span className={`text-[0.66rem] text-center font-medium leading-tight ${state === "upcoming" ? "text-inkfaint" : "text-ink"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
