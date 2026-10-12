import { IndianRupee } from "lucide-react";
import { inputClass } from "./constants";
import { Field, Info, Section } from "./ui";

// Consultation fee. Same props as the other sections:
//   d        = the form while editing, the saved data otherwise (d.consultationFee)
//   editing  = true in Edit Profile mode
//   onChange = (field, value) => void
export default function FeesSection({ d, editing, onChange }) {
  const fee = d.consultationFee;
  const shown = fee === "" || fee === null || fee === undefined || Number(fee) === 0 ? "" : `₹${Number(fee).toLocaleString("en-IN")} per consultation`;

  return (
    <Section title="Consultation Fee" icon={IndianRupee}>
      {editing ? (
        <Field label="Fee per consultation (₹)">
          <input
            className={inputClass}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 500"
            value={fee ?? ""}
            onChange={(e) => onChange("consultationFee", e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </Field>
      ) : (
        <Info label="Fee" value={shown} icon={IndianRupee} />
      )}
    </Section>
  );
}
