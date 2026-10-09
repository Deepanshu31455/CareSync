import { Building2, ShieldCheck, Star } from "lucide-react";
import { cardClass, inputClass } from "./constants";
import { Field } from "./ui";
import ProfilePhoto from "./ProfilePhoto";

export default function ProfileHeader({
  doctor,
  d,
  editing,
  uploading,
  onChange,
  onUpload,
  rating,
}) {
  return (
    <section className={`${cardClass} relative overflow-hidden`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-teal-500" />

      <div className="flex flex-col gap-5 pt-2 sm:flex-row">
        <ProfilePhoto
          src={d.profilePhoto}
          name={d.fullName}
          editing={editing}
          uploading={uploading}
          onUpload={onUpload}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <ShieldCheck size={14} />
              Doctor Profile
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs text-blue-700">
              ID: {doctor.id || doctor._id || "—"}
            </span>
          </div>

          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                <input
                  className={inputClass}
                  value={d.fullName}
                  onChange={(e) => onChange("fullName", e.target.value)}
                />
              </Field>

              <Field label="Specialization">
                <input
                  className={inputClass}
                  value={d.specialization}
                  onChange={(e) => onChange("specialization", e.target.value)}
                />
              </Field>

              <Field label="Qualifications">
                <input
                  className={inputClass}
                  value={d.qualifications}
                  placeholder="MBBS, MD..."
                  onChange={(e) => onChange("qualifications", e.target.value)}
                />
              </Field>

              <Field label="Hospital / Clinic">
                <input
                  className={inputClass}
                  value={d.affiliation}
                  onChange={(e) => onChange("affiliation", e.target.value)}
                />
              </Field>

              <Field label="Years of Experience">
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={d.experience}
                  onChange={(e) => onChange("experience", Number(e.target.value))}
                />
              </Field>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">
                {d.fullName || "Doctor"}
              </h1>

              <p className="mt-1 font-medium text-blue-600">
                {d.specialization || "Specialization not added"}
              </p>

              {d.qualifications && (
                <p className="mt-1 text-sm text-gray-500">{d.qualifications}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Building2 size={16} className="text-teal-600" />
                  {d.affiliation || "Clinic not added"}
                </span>

                <span>{d.experience} years of experience</span>

                {doctor.licenseNumber && <span>License: {doctor.licenseNumber}</span>}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Star size={17} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold">{rating.rating} / 5</span>
                <span className="text-sm text-gray-500">
                  ({rating.totalRatings} ratings)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
