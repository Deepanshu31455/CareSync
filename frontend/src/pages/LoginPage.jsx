import { useState } from "react";
import logo from "../assets/NewLogo.png";
import { useDispatch,useSelector } from "react-redux";
import { useNavigate,Link } from "react-router-dom";
import { setUser } from "../redux/authSlice";
import { GoogleLogin } from "@react-oauth/google";


const ROLES = [
  { id: "patient", label: "Patient", digit: "1" },
  { id: "receptionist", label: "Receptionist", digit: "2" },
  { id: "doctor", label: "Doctor", digit: "3" },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function LoginCard() {
    const user = useSelector((state) => state.authStore.user);//only check error
  const navigate=useNavigate();
  const dispatch=useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [detectedRole, setDetectedRole] = useState(null);

  function handleIdChange(e) {
    const value = e.target.value;

    setId(value);

    // Only detect role when the first character is 1, 2, or 3
    const firstDigit = value.charAt(0);

    const role = ROLES.find((r) => r.digit === firstDigit);

    setDetectedRole(role || null);
  }

async function handleSubmit(e) {
  e.preventDefault();

  // 1. Check whether a valid role was detected
  if (!detectedRole) {
    return;
  }

  // 2. Send login information to backend
  try {

    //basic syntax to interact with backend
    const res = await fetch("http://localhost:4000/api/v1/login", {
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
      console.log(result.message);
      return;
    }

    // 4. Login successful
//    console.log("Logged in:", result);
    const dataforslice = {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
    };
      dispatch(setUser(dataforslice));
      console.log("Redux user dispatched:", dataforslice);
      
    // JWT is already stored in the HttpOnly cookie
    // Navigate to the dashboard
    navigate(`/dashboard/${result.role}`, { replace: true });
  } catch (error) {
    console.error("Login error:", error);
  }
}
async function handleGoogleLogin(credentialResponse) {
  try {
    const credential = credentialResponse?.credential;

    if (!credential) {
      console.error("No Google credential received");
      return;
    }

    const res = await fetch(
      "http://localhost:4000/api/v1/googlelogin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          credential,
        }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      console.error("Google login failed:", result.message);
      return;
    }

    // Backend has verified Google and created your JWT cookie
    const dataforslice = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      profilePhoto:result.user.profilePhoto,
    };

    dispatch(setUser(dataforslice));

    console.log("Google login successful:", dataforslice);

    navigate(`/dashboard/${result.user.role}`, {
      replace: true,
    });

  } catch (error) {
    console.error("Google login error:", error);
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
        }}
      />

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
                onChange={(e) => setPassword(e.target.value)}
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surfacealt text-[0.92rem] text-ink placeholder:text-inkfaint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <button
              type="submit"
              disabled={!detectedRole}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {detectedRole
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
          <a href="/" aria-label="CareSync home">
            <img
              src={logo}
              alt="CareSync logo"
              className="h-9 w-auto"
            />
          </a>

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