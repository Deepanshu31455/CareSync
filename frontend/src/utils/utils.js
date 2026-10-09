export const phoneValidate = (v) => {
  if (!v) return "Phone number is required";
  if (/[a-zA-Z]/.test(v)) return "Numbers only — no letters";
  if (!/^\d{10}$/.test(v)) return "Enter a 10-digit phone number";
  return true;
};

export const phoneInput = (v) => v.replace(/\D/g, "").slice(0, 10);

export const inputClass =
  "w-full px-4 py-2.5 rounded-lg border bg-surfacealt text-[0.92rem] text-ink placeholder:text-inkfaint focus:outline-none focus:ring-2 focus:ring-brand-blue/20";

export function fieldBorder(error) {
  return error ? "border-brand-coral" : "border-border focus:border-brand-blue";
}
