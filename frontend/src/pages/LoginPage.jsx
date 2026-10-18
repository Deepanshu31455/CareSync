import { useState } from "react";
import logo from "../assets/NewLogo.png";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { setUser } from "../redux/authSlice";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE } from "../config";

const ROLES = [
  { id: "patient", label: "Patient", digit: "1" },
  { id: "receptionist", label: "Receptionist", digit: "2" },
  { id: "doctor", label: "Doctor", digit: "3" },
];

function LoginCard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [detectedRole, setDetectedRole] = useState(null);
  const [googleError, setGoogleError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleIdChange(e) {
    const value = e.target.value;
    setId(value);
    setLoginError("");

    // Only detect role when the first character is 1, 2, or 3
    const firstDigit = value.charAt(0);
    const role = ROLES.find((r) => r.digit === firstDigit);

    setDetectedRole(role || null);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    setLoginError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoginError("");

    // 1. Check whether a valid role was detected
    if (!detectedRole) {
      setLoginError("Please enter a valid CareSync ID starting with 1, 2, or 3.");
      return;
    }

    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    // 2. Send login information to backend
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id,
          password,
        }),
      });

      const result = await res.json();

      // 3. Login failed
      if (!res.ok) {
        setLoginError(result.message || "Invalid ID or password. Please try again.");
        return;
      }

      // 4. Login successful - include profilePhoto
      const dataforslice = {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        profilePhoto: result.profilePhoto || "",
      };

      dispatch(setUser(dataforslice));

      // Navigate to the dashboard or home
      navigate(result.role === "patient" ? "/" : `/dashboard/${result.role}`, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Cannot connect to server. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin(credentialResponse) {
    setGoogleError("");
    setLoginError("");

    try {
      const credential = credentialResponse?.credential;

      if (!credential) {
        console.error("No Google credential received");
        setGoogleError("Email is not registered.");
        return;
      }

      const res = await fetch(`${API_BASE}/googlelogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          credential,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        const message = result?.message || "Email is not registered.";
        const normalizedMessage = message.toLowerCase();

        if (
          normalizedMessage.includes("not registered") ||
          normalizedMessage.includes("does not exist") ||
          normalizedMessage.includes("register first")
        ) {
          setGoogleError("Email is not registered.");
        } else {
          setGoogleError(message);
        }
        console.error("Google login failed:", message);
        return;
      }

      setGoogleError("");

      // Backend has verified Google and created your JWT cookie
      const dataforslice = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        profilePhoto: result.user.profilePhoto || "",
      };

      dispatch(setUser(dataforslice));

      navigate(result.user.role === "patient" ? "/" : `/dashboard/${result.user.role}`, {
        replace: true,
      });
    } catch (error) {
      console.error("Google login error:", error);
      setGoogleError("Email is not registered.");
    }
  }

  return (
    <article className="relative max-w-[520px] mx-auto overflow-hidden bg-surface border border-border rounded-2xl p-8 shadow-card">
      <span
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-blue to-brand-teal"
        aria-hidden="true"
      />

      <p className="font-mono text-[0.78rem] tracking-[0.1em] uppercase text-brand-blue mb-2">
        Account Login
      </p>

      <h2 className="font-display text-[1.4rem] text-ink mb-2">
        Log in to CareSync
      </h2>

      <p className="text-[0.92rem] text-inksoft mb-7">
        Enter your CareSync ID and password to continue.
      </p>

      <div className="space-y-3">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            console.log("Google Login Failed");
            setGoogleError("Email is not registered.");
          }}
        />

        {googleError && (
          <p className="text-[0.82rem] font-medium text-red-600 mt-1">{googleError}</p>
        )}

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="w-full inline-flex items-center justify-center px-5 py-3 rounded-full bg-ink text-white font-medium text-[0.92rem] transition-all hover:bg-brand-bluedeep hover:-translate-y-0.5"
        >
          {showForm ? "Hide ID & password" : "Log in with ID & password"}
        </button>

        {showForm && (
          <form className="pt-3 space-y-3" onSubmit={handleSubmit}>
            {loginError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-[0.84rem] text-red-600 font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-id"
                className="block text-[0.8rem] font-medium text-inksoft mb-1.5"
              >
                CareSync ID
              </label>

              <input
                id="login-id"
                type="number"
                value={id}
                onChange={handleIdChange}
                autoComplete="username"
                placeholder="Enter your CareSync ID"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surfacealt text-[0.92rem] text-ink placeholder:text-inkfaint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />

              {detectedRole && (
                <p className="mt-2 text-[0.82rem] text-brand-teal">
                  Detected account: {detectedRole.label}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[0.8rem] font-medium text-inksoft mb-1.5"
              >
                Password
              </label>

              <input
                value={password}
                onChange={handlePasswordChange}
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surfacealt text-[0.92rem] text-ink placeholder:text-inkfaint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <button
              type="submit"
              disabled={!detectedRole || submitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Logging in..."
                : detectedRole
                ? `Log in as ${detectedRole.label}`
                : "Enter a valid ID"}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="max-w-content mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
          <Link to="/" aria-label="CareSync home">
            <img
              src={logo}
              alt="CareSync logo"
              className="h-9 w-auto"
            />
          </Link>

          <Link
            to="/"
            className="text-sm font-medium text-inksoft hover:text-brand-blue transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-content mx-auto px-6 md:px-8 py-13 md:pt-15 pb-30">
        <div className="text-center max-w-[52ch] mx-auto mb-14">
          <p className="eyebrow justify-center flex">
            Log in
          </p>

          <h1 className="text-[clamp(1.9rem,1.4rem+2vw,2.75rem)] font-display font-medium text-ink mb-3">
            Welcome back to CareSync
          </h1>

          <p className="text-inksoft">
            Enter your ID and we'll automatically identify your account type.
          </p>
        </div>

        <LoginCard />

        <div className="text-center mt-10">
          <p className="text-[0.92rem] text-inksoft">
            Not registered yet?{" "}
            <Link
              to="/register"
              replace
              className="font-semibold text-brand-blue hover:text-brand-bluedeep underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
