import { cardClass } from "./constants";

export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Section({ title, icon: Icon, children }) {
  return (
    <section className={cardClass}>
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-800">
        <Icon size={19} className="text-teal-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Info({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-teal-50 p-2 text-teal-600">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
        <p className="mt-1 break-words text-sm text-gray-800">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}
