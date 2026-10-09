import { Phone, MapPin, ShieldCheck } from "lucide-react";
import { inputClass } from "./constants";
import { Field, Section, Info } from "./ui";
import { phoneInput } from "../../utils/utils";

export default function ContactSection({ doctor, d, editing, onChange }) {
  return (
    <Section title="Contact & Address" icon={Phone}>
      {editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary Phone">
            <input
              className={inputClass}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit number"
              value={d.phone1}
              onChange={(e) => onChange("phone1", phoneInput(e.target.value))}
            />
          </Field>

          <Field label="Secondary Phone">
            <input
              className={inputClass}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit number"
              value={d.phone2}
              onChange={(e) => onChange("phone2", phoneInput(e.target.value))}
            />
          </Field>

          <Field label="Clinic Address">
            <textarea
              rows={3}
              className={inputClass}
              value={d.clinicAddress}
              onChange={(e) => onChange("clinicAddress", e.target.value)}
            />
          </Field>

          <Field label="Email (read-only)">
            <input className={inputClass} value={doctor.email || ""} disabled />
          </Field>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Info label="Primary Phone" value={d.phone1} icon={Phone} />
          <Info label="Secondary Phone" value={d.phone2} icon={Phone} />
          <Info label="Clinic Address" value={d.clinicAddress} icon={MapPin} />
          <Info label="Email" value={doctor.email} icon={ShieldCheck} />
        </div>
      )}
    </Section>
  );
}
