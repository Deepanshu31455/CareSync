import { useState } from "react";
import { useForm } from "react-hook-form";
import logo from "../assets/NewLogo.png";

import { ROLES, STEP_FIELDS } from "../features/RegisterPage_constants";
import Stepper from "../features/RegisterPage_Stepper";
import EmailStep from "../features/RegisterPage_EmailStep";
import PersonalStep from "../features/RegisterPage_PersonalStep";
import RoleStep from "../features/RegisterPage_RoleStep";
import DetailsStep from "../features/RegisterPage_DetailsStep";
import AccountStep from "../features/RegisterPage_AccountStep";
import PhoneVerifyStep from "../features/RegisterPage_PhoneVerifyStep";

export default function RegisterPage() {
  const [stepKey, setStepKey] = useState("email");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({ mode: "onBlur", defaultValues: { idSuffix: "", authMethod: "" } });

  const role = watch("role");
  const selectedRole = ROLES.find((r) => r.id === role);
  const steps = role === "receptionist"
    ? ["email", "personal", "role", "account", "phoneVerify"]
    : ["email", "personal", "role", "details", "account", "phoneVerify"];
  const stepIndex = steps.indexOf(stepKey);
  const isLastStep = stepKey === "phoneVerify";

  async function goNext() {
    const fields = stepKey === "details" ? STEP_FIELDS.details[role] ?? [] : STEP_FIELDS[stepKey];
    const valid = await trigger(fields);
    if (valid) setStepKey(steps[stepIndex + 1]);
  }

  function goBack() {
    setStepKey(steps[stepIndex - 1]);
  }

  const onSubmit = (data) => {
    const fullId = `${selectedRole.digit}${data.idSuffix}`;
    // Hand this off to your registration API.
    console.log("Register:", { ...data, id: fullId });
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="max-w-content mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
          <a href="/" aria-label="CareSync home">
            <img src={logo} alt="CareSync logo" className="h-9 w-auto" />
          </a>
          <a href="/login" className="text-sm font-medium text-inksoft hover:text-brand-blue transition-colors">
            Already have an account? Log in
          </a>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-6 md:px-8 py-14 md:py-20">
        <div className="text-center mb-10">
          <p className="eyebrow justify-center flex">Register</p>
          <h1 className="text-[clamp(1.9rem,1.4rem+2vw,2.5rem)] font-display font-medium text-ink">
            Create your CareSync account
          </h1>
        </div>

        <Stepper steps={steps} current={stepIndex} role={selectedRole} />

        <form
          onSubmit={isLastStep ? handleSubmit(onSubmit) : (e) => e.preventDefault()}
          className="bg-surface border border-border rounded-2xl shadow-card p-8 mt-8"
        >
          {stepKey === "email" && (
            <EmailStep register={register} setValue={setValue} watch={watch} errors={errors} />
          )}

          {stepKey === "personal" && <PersonalStep register={register} errors={errors} />}

          {stepKey === "role" && (
            <RoleStep
              role={role}
              setRole={(id) => setValue("role", id, { shouldValidate: true })}
              register={register}
              error={errors.role}
              menuOpen={roleMenuOpen}
              setMenuOpen={setRoleMenuOpen}
            />
          )}

          {stepKey === "details" && <DetailsStep role={role} register={register} errors={errors} />}

          {stepKey === "account" && (
            <AccountStep
              selectedRole={selectedRole}
              register={register}
              errors={errors}
              watch={watch}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirm={showConfirm}
              setShowConfirm={setShowConfirm}
            />
          )}

          {stepKey === "phoneVerify" && (
            <PhoneVerifyStep register={register} setValue={setValue} watch={watch} errors={errors} />
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="btn-ghost disabled:opacity-0 disabled:pointer-events-none"
            >
              Back
            </button>

            {!isLastStep ? (
              <button type="button" onClick={goNext} className="btn-primary">
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-primary">
                Create account
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
