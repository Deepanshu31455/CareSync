import { AlertCircle, Inbox, Lock } from "lucide-react";
import { cardClass } from "./constants";

// White rounded card used around every section
export function Card({ children, className = "" }) {
  return <section className={`${cardClass} ${className}`}>{children}</section>;
}

// Heading at the top of a section, with an optional hint line
export function TabTitle({ children, hint }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-xl font-semibold text-slate-900">{children}</h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

// Label above an input
export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

// Label and plain text. `locked` adds a lock icon for fields that can never change.
export function ReadOnly({ label, value, locked }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {locked && <Lock size={12} aria-label="Cannot be changed" />}
      </p>
      <p className="mt-1 break-words text-sm text-slate-800">{value || "Not provided"}</p>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center">
      <Inbox size={28} className="text-slate-300" />
      <p className="max-w-sm text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function ErrorState({ text, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertCircle size={36} className="text-red-500" />
      <p className="text-sm text-slate-700">{text}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  const colour =
    status === "paid"
      ? "bg-green-50 text-green-700"
      : status === "pending"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colour}`}>
      {status || "unknown"}
    </span>
  );
}

// Small clickable picture. Clicking opens the larger view.
export function Thumb({ src, alt, onClick, className = "h-24 w-24" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="View larger"
      className={`${className} shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50`}
    >
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </button>
  );
}
