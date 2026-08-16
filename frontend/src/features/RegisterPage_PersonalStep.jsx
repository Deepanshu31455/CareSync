import Field from "../components/RegisterPage_Field";
import { inputClass, fieldBorder, phoneValidate } from "..//utils/utils";

export default function PersonalStep({ register, errors }) {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <Field label="Full name" error={errors.fullName}>
        <input
          {...register("fullName", { required: "Full name is required" })}
          className={`${inputClass} ${fieldBorder(errors.fullName)}`}
          placeholder="Jane Doe"
        />
      </Field>

      <Field label="Phone number" error={errors.phone}>
        <input
          type="tel"
          inputMode="numeric"
          {...register("phone", { validate: phoneValidate })}
          className={`${inputClass} ${fieldBorder(errors.phone)}`}
          placeholder="10-digit number"
          maxLength={10}
        />
      </Field>

      <Field label="Date of birth" error={errors.dob}>
        <input
          type="date"
          {...register("dob", { required: "Date of birth is required" })}
          className={`${inputClass} ${fieldBorder(errors.dob)}`}
        />
      </Field>

      <Field label="Gender" error={errors.gender}>
        <select {...register("gender", { required: "Please select a gender" })} className={`${inputClass} ${fieldBorder(errors.gender)}`}>
          <option value="">Select</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field label="Address" error={errors.address}>
          <textarea
            rows={3}
            {...register("address", { required: "Address is required" })}
            className={`${inputClass} ${fieldBorder(errors.address)} resize-none`}
            placeholder="Street, city, state, PIN code"
          />
        </Field>
      </div>
    </div>
  );
}
