import { useRef, useState } from "react";
import { UserPlus } from "lucide-react";

import { Card, Field } from "../shared/ui";
import { inputClass } from "../shared/constants";
import { onlyDigits } from "../shared/helpers";
import { WALK_IN_GENDERS } from "./constants";

const EMPTY = { name: "", phone: "", age: "", gender: "" };

// Adds a person who does not use the app. Only these four things are kept.
//   disabled   true when the day is not today
//   onSubmit   (form) => Promise<true | false>; the form clears itself on true
export default function WalkInForm({ disabled, working, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [problem, setProblem] = useState(null);
  const nameRef = useRef(null);

  const set = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  async function submit(event) {
    event.preventDefault();

    // The same rules as the server, so mistakes are caught before sending
    const name = form.name.trim();
    const age = Number(form.age);
    if (name.length < 2) return setProblem("Enter the patient's name.");
    if (!/^\d{10}$/.test(form.phone)) return setProblem("Enter a 10-digit phone number.");
    if (form.age === "" || !Number.isInteger(age) || age < 0 || age > 120) return setProblem("Enter a valid age.");
    if (!form.gender) return setProblem("Choose a gender.");

    setProblem(null);
    const added = await onSubmit({ name, phone: form.phone, age, gender: form.gender });
    if (added) {
      setForm(EMPTY);
      nameRef.current?.focus(); // ready for the next person
    }
  }

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-slate-900">
        <UserPlus size={18} /> Add walk-in patient
      </h2>
      <p className="mt-1 text-xs text-slate-500">For people who do not use the app. Only these details are kept.</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Name">
          <input
            ref={nameRef}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={60}
            disabled={disabled}
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => set("phone", onlyDigits(e.target.value, 10))}
              inputMode="numeric"
              disabled={disabled}
              className={inputClass}
              autoComplete="off"
            />
          </Field>
          <Field label="Age">
            <input
              value={form.age}
              onChange={(e) => set("age", onlyDigits(e.target.value, 3))}
              inputMode="numeric"
              disabled={disabled}
              className={inputClass}
              autoComplete="off"
            />
          </Field>
        </div>

        <Field label="Gender">
          <div className="flex gap-2">
            {WALK_IN_GENDERS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => set("gender", option.value)}
                disabled={disabled}
                aria-pressed={form.gender === option.value}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm disabled:opacity-50 ${
                  form.gender === option.value
                    ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        {problem && <p className="text-sm text-red-600">{problem}</p>}
        {disabled && <p className="text-xs text-slate-400">Walk-ins are added for today only.</p>}

        <button
          type="submit"
          disabled={disabled || working !== null}
          className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {working === "add" ? "Adding..." : "Add to queue"}
        </button>
      </form>
    </Card>
  );
}
