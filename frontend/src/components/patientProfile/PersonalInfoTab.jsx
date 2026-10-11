import { useState } from "react";
import { Edit3, Save, X } from "lucide-react";
import { BLOOD_GROUPS, GENDERS, inputClass } from "./constants";
import { buildForm, onlyTenDigits } from "./helpers";
import { Card, Field, ReadOnly, TabTitle } from "./ui";

// Personal details with an Edit Profile mode.
// Patient ID and email are shown as locked text and are never part of the form.
//   profile = saved details from Redux
//   onSave  = (form) => Promise<boolean>   true when it was saved
export default function PersonalInfoTab({ profile, saving, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => buildForm(profile));
  const [problem, setProblem] = useState(null);

  const change = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  function startEditing() {
    setForm(buildForm(profile)); // always start from the saved data
    setProblem(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setProblem(null);
  }

  async function save() {
    // Quick checks before sending
    if (!form.fullName.trim()) {
      setProblem("Please enter your full name.");
      return;
    }
    if (form.phone.length !== 10 || form.emergencyContact.length !== 10) {
      setProblem("Phone numbers must be exactly 10 digits.");
      return;
    }

    setProblem(null);
    const worked = await onSave(form);
    if (worked) setEditing(false);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TabTitle hint="Your Patient ID and email cannot be changed.">Personal Information</TabTitle>

        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        )}
      </div>

      {problem && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{problem}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Always plain text, never an input */}
        <ReadOnly label="Patient ID" value={profile.id} locked />
        <ReadOnly label="Email" value={profile.email} locked />

        {editing ? (
          <>
            <Field label="Full Name">
              <input className={inputClass} value={form.fullName} onChange={(e) => change("fullName", e.target.value)} />
            </Field>

            <Field label="Phone">
              <input
                className={inputClass}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => change("phone", onlyTenDigits(e.target.value))}
              />
            </Field>

            <Field label="Date of Birth">
              <input className={inputClass} type="date" value={form.dob} onChange={(e) => change("dob", e.target.value)} />
            </Field>

            <Field label="Gender">
              <select className={inputClass} value={form.gender} onChange={(e) => change("gender", e.target.value)}>
                <option value="">Select</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>

            <Field label="Blood Group">
              <select className={inputClass} value={form.bloodGroup} onChange={(e) => change("bloodGroup", e.target.value)}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>

            <Field label="Emergency Contact">
              <input
                className={inputClass}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.emergencyContact}
                onChange={(e) => change("emergencyContact", onlyTenDigits(e.target.value))}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address">
                <textarea rows={2} className={inputClass} value={form.address} onChange={(e) => change("address", e.target.value)} />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Known Conditions / Allergies (optional)">
                <textarea
                  rows={2}
                  className={inputClass}
                  value={form.knownConditions}
                  onChange={(e) => change("knownConditions", e.target.value)}
                />
              </Field>
            </div>
          </>
        ) : (
          <>
            <ReadOnly label="Full Name" value={profile.fullName} />
            <ReadOnly label="Phone" value={profile.phone} />
            <ReadOnly label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString("en-IN") : ""} />
            <ReadOnly label="Gender" value={profile.gender} />
            <ReadOnly label="Blood Group" value={profile.bloodGroup} />
            <ReadOnly label="Emergency Contact" value={profile.emergencyContact} />
            <div className="sm:col-span-2"><ReadOnly label="Address" value={profile.address} /></div>
            <div className="sm:col-span-2"><ReadOnly label="Known Conditions / Allergies" value={profile.knownConditions} /></div>
          </>
        )}
      </div>
    </Card>
  );
}
