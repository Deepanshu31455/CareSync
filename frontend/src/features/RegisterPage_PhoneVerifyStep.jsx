import { useState } from "react";
import Field from "../components/RegisterPage_Field";
import { inputClass } from "../utils/utils";

export default function PhoneVerifyStep({ register, setValue, watch, errors }) {
  const phone = watch("phone");
  const phoneVerified = watch("phoneVerified");

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  register("phoneVerified", { validate: (v) => v === true || "Verify your phone number to finish" });

  function sendOtp() {
    // TODO: replace with a real "send OTP to phone" API call
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpError("");
    console.log("Demo phone OTP:", code);
  }

  function verifyOtp() {
    if (otpInput === generatedOtp) {
      setValue("phoneVerified", true, { shouldValidate: true });
      setOtpError("");
    } else {
      setOtpError("Incorrect code — try again");
    }
  }

  if (phoneVerified) {
    return (
      <div className="px-5 py-4 rounded-xl border border-brand-teal bg-surfacealt">
        <p className="text-[0.92rem] font-medium text-ink">✓ Phone number verified</p>
        <p className="text-[0.82rem] text-inksoft">{phone}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[0.92rem] text-inksoft">
        We'll send a one-time code to <span className="font-medium text-ink">{phone}</span> to confirm it's yours.
      </p>

      {!otpSent ? (
        <button type="button" onClick={sendOtp} className="btn-primary w-full">
          Send OTP
        </button>
      ) : (
        <Field label="Enter the 6-digit code">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={`${inputClass} border-border`}
            />
            <button type="button" onClick={verifyOtp} className="shrink-0 px-4 rounded-lg bg-brand-blue text-white text-[0.86rem] font-medium">
              Verify
            </button>
          </div>
          {otpError && <p className="text-[0.78rem] text-brand-coral mt-1.5">{otpError}</p>}
          <button type="button" onClick={sendOtp} className="text-[0.8rem] font-semibold text-brand-blue mt-2">
            Resend code
          </button>
        </Field>
      )}

      {errors.phoneVerified && !otpSent && <p className="text-[0.78rem] text-brand-coral">{errors.phoneVerified.message}</p>}
    </div>
  );
}
