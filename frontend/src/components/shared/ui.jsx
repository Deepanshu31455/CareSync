import { AlertCircle, CheckCircle2, Inbox, Lock } from "lucide-react";
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
        <button onClick={onRetry} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Retry
        </button>
      )}
    </div>
  );
}

// The green / red message bars at the top of a page
export function Messages({ success, error }) {
  return (
    <>
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}
    </>
  );
}

// Round photo, or the first letter of the name when there is no photo
export function Avatar({ src, name, className = "h-12 w-12 text-lg" }) {
  return src ? (
    <img src={src} alt={name} className={`${className} shrink-0 rounded-full border border-slate-200 object-cover`} />
  ) : (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white`}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}
