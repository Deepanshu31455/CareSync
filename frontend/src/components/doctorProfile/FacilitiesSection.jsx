import { useState } from "react";
import { Building2, CheckCircle2, Plus, X } from "lucide-react";
import { inputClass } from "./constants";
import { Section } from "./ui";

export default function FacilitiesSection({ d, editing, onChange }) {
  const [newFacility, setNewFacility] = useState("");

  function addFacility() {
    const value = newFacility.trim();
    if (!value) return;

    const exists = d.facilities.some((f) => f.toLowerCase() === value.toLowerCase());
    if (!exists) onChange("facilities", [...d.facilities, value]);
    setNewFacility("");
  }

  function removeFacility(name) {
    onChange("facilities", d.facilities.filter((f) => f !== name));
  }

  return (
    <Section title="Clinic Facilities" icon={Building2}>
      {editing && (
        <div className="mb-4 flex gap-2">
          <input
            className={inputClass}
            placeholder="Enter a facility"
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFacility();
              }
            }}
          />

          <button
            type="button"
            onClick={addFacility}
            className="rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {d.facilities.length === 0 && (
          <p className="text-sm text-gray-500">No facilities listed.</p>
        )}

        {d.facilities.map((facility) => (
          <span
            key={facility}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          >
            <CheckCircle2 size={15} className="text-teal-600" />
            {facility}

            {editing && (
              <button
                type="button"
                onClick={() => removeFacility(facility)}
                title="Remove facility"
                className="text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
      </div>
    </Section>
  );
}
