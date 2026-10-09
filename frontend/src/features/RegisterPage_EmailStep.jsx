import { useState, useEffect, useRef } from "react";
import Field from "../components/FirstPage/RegisterPage_Field";
import { GoogleIcon } from "../components/icons";
import { inputClass, fieldBorder } from "../utils/utils";
import { GoogleLogin } from "@react-oauth/google";

const RESEND_COOLDOWN_SECONDS = 30;

export default function EmailStep({ register, setValue, watch, errors }) {
  const authMethod = watch("authMethod");
  const email = watch("email");
  const emailVerified = watch("emailVerified");

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Move focus into the OTP field the moment it appears, so the user can
  // start typing the code straight away without reaching for the mouse.
  useEffect(() => {
    if (otpSent && !emailVerified) {
      otpInputRef.current?.focus();
    }
  }, [otpSent, emailVerified]);

  // Hidden fields — react-hook-form validates these even though there's
  // no visible input for them.
  register("emailVerified", { validate: (v) => v === true || "Verify your email to continue" });
  register("email", {
    required: "Email is required",
    pattern: { value: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, message: "Enter a valid Gmail address" },
  });




async function continueWithGoogle(credentialResponse) {
  try {
    const credential = credentialResponse?.credential;

    if (!credential) {
      setOtpError("Google authentication failed");
      return;
    }

    const res = await fetch(
      "http://localhost:4000/api/v1/googleregister",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setOtpError(data.message || "Google verification failed");
      return;
    }

    const googleUser = data.googleUser;

    setValue("authMethod", "google");

    setValue("email", googleUser.email, {
      shouldValidate: true,
    });

    setValue("emailVerified", true, {
      shouldValidate: true,
    });

    // If you want to keep these for later registration:

    setOtpError("");

    console.log("Google verified:", googleUser);

  } catch (error) {
    console.error("Google authentication error:", error);

    setOtpError("Cannot connect to server");
  }
}




  function useGmailInstead() {
    setValue("authMethod", "manual");
    setValue("email", "");
    setValue("emailVerified", false, { shouldValidate: true });
    setOtpSent(false);
    setOtpInput("");
    setCooldown(0);
  }

  async function sendOtp() {
    if (cooldown > 0) return; // guard against double-clicks while waiting

      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(email || "")) {
      setOtpError("Enter a valid email address first");
      console.log("OTP cannot be sent");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/v1/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setOtpError("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      console.error("OTP error:", error);
      setOtpError("Cannot connect to server");
    }
  }

  async function verifyOtp() {
    try {
      const res = await fetch("http://localhost:4000/api/v1/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message);
        return;
      }

      setValue("emailVerified", true, { shouldValidate: true });
      setOtpError("");
    } catch (error) {
      console.error(error);
      setOtpError("Cannot connect to server");
    }
  }

  if (authMethod === "google" && emailVerified) {
    return (
      <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-brand-teal bg-surfacealt">
        <div>
          <p className="text-[0.92rem] font-medium text-ink">Verified with Google</p>
          <p className="text-[0.82rem] text-inksoft">{email}</p>
        </div>
        <button type="button" onClick={useGmailInstead} className="text-[0.82rem] font-semibold text-brand-blue">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
    <GoogleLogin
      onSuccess={continueWithGoogle}
      onError={() => {
        setOtpError("Google authentication failed");
      }}
    />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.78rem] text-inkfaint">or use your Gmail</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Field label="Gmail address" error={errors.email}>
        <div className="flex gap-2">
          <input
            type="email"
            value={email || ""}
            onChange={(e) => {
              setValue("authMethod", "manual");
              setValue("email", e.target.value, { shouldValidate: true });
              setValue("emailVerified", false, { shouldValidate: true });
              setOtpSent(false);
              setCooldown(0);
            }}
            placeholder="yourname@gmail.com"
            disabled={emailVerified}
            className={`${inputClass} ${fieldBorder(errors.email)} disabled:opacity-60`}
          />
          <button
            type="button"
            onClick={sendOtp}
            disabled={emailVerified || cooldown > 0}
            className="shrink-0 px-4 rounded-lg bg-ink text-white text-[0.86rem] font-medium disabled:opacity-40"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? "Resend" : "Send OTP"}
          </button>
        </div>
      </Field>

      {otpSent && !emailVerified && (
        <Field label="Enter the 6-digit code">
          <div className="flex gap-2">
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={`${inputClass} border-border`}
            />
            <button
              type="button"
              onClick={verifyOtp}
              className="shrink-0 px-4 rounded-lg bg-brand-blue text-white text-[0.86rem] font-medium"
            >
              Verify
            </button>
          </div>
          {otpError && <p className="text-[0.78rem] text-brand-coral mt-1.5">{otpError}</p>}
        </Field>
      )}

      {emailVerified && (
        <p className="text-[0.82rem] font-medium text-brand-teal">✓ Email verified</p>
      )}
      {errors.emailVerified && !otpSent && (
        <p className="text-[0.78rem] text-brand-coral">{errors.emailVerified.message}</p>
      )}
    </div>
  );
}

