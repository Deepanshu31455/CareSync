import { useEffect } from "react";

// TODO: Phone verification via SMS (Twilio / MSG91) will be implemented in a future release.
// For now, the phone number entered by the user is accepted as-is and phoneVerified is
// automatically set to true on the client. The backend register route also auto-passes
// phone verification for the same reason.
export default function PhoneVerifyStep({ register, setValue, watch, errors }) {
  const phone = watch("phone");
  const phoneVerified = watch("phoneVerified");

  register("phoneVerified", { validate: (v) => v === true || "Phone number is required" });

  // Auto-pass: mark verified as soon as the step mounts.
  // Replace this with a real SMS OTP call when the gateway is ready.
  useEffect(() => {
    setValue("phoneVerified", true, { shouldValidate: true });
  }, [setValue]);

  return (
    <div className="px-5 py-4 rounded-xl border border-brand-teal bg-surfacealt space-y-2">
      <p className="text-[0.92rem] font-medium text-ink">✓ Phone number accepted</p>
      <p className="text-[0.82rem] text-inksoft">{phone}</p>
      <p className="text-[0.75rem] text-inksoft italic">
        SMS verification will be available in a future update.
      </p>
    </div>
  );
}

