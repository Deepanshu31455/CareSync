import { ExternalLink, Navigation } from "lucide-react";
import { inputClass } from "./constants";
import { Field, Section } from "./ui";

function MapLinkView({ link }) {
  const trimmed = link?.trim();

  if (!trimmed) {
    return <p className="text-sm text-gray-500">No map link provided.</p>;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return (
      <p className="text-sm text-red-600">
        Invalid map link. Edit this field and paste the full Google Maps link,
        including https://
      </p>
    );
  }

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 break-all text-sm text-blue-600 hover:underline"
    >
      Open clinic location
      <ExternalLink size={15} />
    </a>
  );
}

export default function DirectionsSection({ d, editing, onChange }) {
  const setDirection = (key, value) =>
    onChange("directions", { ...d.directions, [key]: value });

  return (
    <Section title="Directions & How to Reach" icon={Navigation}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Navigation Instructions">
          {editing ? (
            <textarea
              rows={3}
              className={inputClass}
              value={d.directions.instructions}
              onChange={(e) => setDirection("instructions", e.target.value)}
            />
          ) : (
            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
              {d.directions.instructions || "Not provided"}
            </p>
          )}
        </Field>

        <Field label="Nearby Landmark">
          {editing ? (
            <input
              className={inputClass}
              value={d.directions.landmark}
              onChange={(e) => setDirection("landmark", e.target.value)}
            />
          ) : (
            <p className="text-sm text-gray-600">
              {d.directions.landmark || "Not provided"}
            </p>
          )}
        </Field>

        <div className="sm:col-span-2">
          <Field label="Map Link">
            {editing ? (
              <input
                type="url"
                className={inputClass}
                value={d.directions.mapLink}
                placeholder="https://maps.google.com/..."
                onChange={(e) => setDirection("mapLink", e.target.value)}
              />
            ) : (
              <MapLinkView link={d.directions.mapLink} />
            )}
          </Field>
        </div>
      </div>
    </Section>
  );
}
