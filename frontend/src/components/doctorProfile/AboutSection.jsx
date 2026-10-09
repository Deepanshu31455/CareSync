import { Stethoscope } from "lucide-react";
import { inputClass } from "./constants";
import { Section } from "./ui";

export default function AboutSection({ d, editing, onChange }) {
  return (
    <Section title="About & Clinical Description" icon={Stethoscope}>
      {editing ? (
        <textarea
          rows={5}
          className={inputClass}
          value={d.otherDescription}
          onChange={(e) => onChange("otherDescription", e.target.value)}
          placeholder="Describe your expertise, treatments, and approach to patient care..."
        />
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
          {d.otherDescription || "No clinical description added yet."}
        </p>
      )}
    </Section>
  );
}
