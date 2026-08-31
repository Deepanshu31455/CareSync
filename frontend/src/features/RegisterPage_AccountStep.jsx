import Field from "../components/FirstPage/RegisterPage_Field";
import { inputClass, fieldBorder } from "../utils/utils";

export default function AccountStep({ selectedRole, register, errors, watch, showPassword, setShowPassword, showConfirm, setShowConfirm }) {
  return (
    <div className="grid gap-5">
      <Field label="Your login ID (6 digits)" error={errors.idSuffix}>
        <div className="flex">
          <span className="flex items-center justify-center px-4 rounded-l-lg border border-r-0 border-border bg-surfacealt font-mono text-ink">
            {selectedRole?.digit ?? "•"}
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            {...register("idSuffix", {
              required: "Enter the rest of your ID",
              pattern: { value: /^\d{5}$/, message: "Enter exactly 5 digits" },
            })}
            placeholder="00000"
            className={`w-full px-4 py-2.5 rounded-r-lg border ${fieldBorder(errors.idSuffix)} bg-surfacealt text-[0.92rem] text-ink placeholder:text-inkfaint focus:outline-none focus:ring-2 focus:ring-brand-blue/20`}
          />
        </div>
      </Field>

      <Field label="Password" error={errors.password}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
            className={`${inputClass} ${fieldBorder(errors.password)} pr-16`}
            placeholder="At least 8 characters"
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.78rem] font-semibold text-brand-blue">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      <Field label="Confirm password" error={errors.confirmPassword}>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (v) => v === watch("password") || "Passwords don't match",
            })}
            className={`${inputClass} ${fieldBorder(errors.confirmPassword)} pr-16`}
            placeholder="Re-enter your password"
          />
          <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.78rem] font-semibold text-brand-blue">
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
    </div>
  );
}
