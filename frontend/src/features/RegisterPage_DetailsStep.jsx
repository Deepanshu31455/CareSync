import Field from "../components/RegisterPage_Field";
import { inputClass, fieldBorder, phoneValidate } from "../utils/utils";

export default function DetailsStep({ role, register, errors }) {
  if (role === "patient") {
    return (
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Blood group" error={errors.bloodGroup}>
          <select {...register("bloodGroup", { required: "Blood group is required" })} className={`${inputClass} ${fieldBorder(errors.bloodGroup)}`}>
            <option value="">Select</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </Field>

        <Field label="Emergency contact number" error={errors.emergencyContact}>
          <input
            type="tel"
            inputMode="numeric"
            {...register("emergencyContact", { validate: phoneValidate })}
            className={`${inputClass} ${fieldBorder(errors.emergencyContact)}`}
            placeholder="10-digit number"
            maxLength={10}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Known allergies or conditions (optional)">
            <textarea rows={3} {...register("knownConditions")} className={`${inputClass} border-border resize-none`} placeholder="e.g. penicillin allergy, asthma" />
          </Field>
        </div>
      </div>
    );
  }

  if (role === "doctor") {
    return (
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Specialization" error={errors.specialization}>
          <input {...register("specialization", { required: "Specialization is required" })} className={`${inputClass} ${fieldBorder(errors.specialization)}`} placeholder="e.g. General Physician" />
        </Field>

        <Field label="Medical license number" error={errors.licenseNumber}>
          <input {...register("licenseNumber", { required: "License number is required" })} className={`${inputClass} ${fieldBorder(errors.licenseNumber)}`} placeholder="License / registration no." />
        </Field>

        <Field label="Years of experience" error={errors.experience}>
          <input type="number" min="0" {...register("experience", { required: "Experience is required" })} className={`${inputClass} ${fieldBorder(errors.experience)}`} placeholder="e.g. 6" />
        </Field>

        <Field label="Clinic / hospital affiliation (optional)">
          <input {...register("affiliation")} className={`${inputClass} border-border`} placeholder="Where you currently practice" />
        </Field>
      </div>
    );
  }

  return null;
}
