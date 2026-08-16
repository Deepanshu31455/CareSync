import { useState } from "react";
import logo from "../assets/NewLogo.png";

const roles = [
  {
    id: "patient",
    tag: "Patient",
    title: "See your history, book a visit",
    desc: "Access your medical records and switch between in-person and video visits.",
    accent: "from-brand-blue to-brand-teal",
  },
  {
    id: "doctor",
    tag: "Doctor",
    title: "Open a patient's full record",
    desc: "Review history before the visit and diagnose with complete context.",
    accent: "from-brand-teal to-brand-blue",
  },
  {
    id: "receptionist",
    tag: "Receptionist",
    title: "Manage the front desk",
    desc: "Register patients, book slots and route them to the right doctor.",
    accent: "from-brand-coral to-brand-blue",
  },
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




function RoleLoginCard({ role }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <article className="relative overflow-hidden bg-surface border border-border rounded-2xl p-8 flex flex-col shadow-card">
      <span
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${role.accent}`}
        aria-hidden="true"
      />

      <p className="font-mono text-[0.78rem] tracking-[0.1em] uppercase text-brand-blue mb-2">
        {role.tag}
      </p>
      <h2 className="font-display text-[1.3rem] text-ink mb-2">{role.title}</h2>
      <p className="text-[0.92rem] text-inksoft mb-7">{role.desc}</p>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-full border border-border bg-white font-medium text-[0.92rem] text-ink transition-all hover:border-brand-blue hover:-translate-y-0.5"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="w-full inline-flex items-center justify-center px-5 py-3 rounded-full bg-ink text-white font-medium text-[0.92rem] transition-all hover:bg-brand-bluedeep hover:-translate-y-0.5"
        >
          {showForm ? "Hide ID & password" : "Log in with ID & password"}
        </button>

        {showForm && (
          <form className="pt-3 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label
                htmlFor={`${role.id}-id`}
                className="block text-[0.8rem] font-medium text-inksoft mb-1.5"
              >
                {role.tag} ID
              </label>
              <input
                id={`${role.id}-id`}
                type="text"
                autoComplete="username"
                placeholder={`Enter your ${role.tag.toLowerCase()} ID`}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surfacealt text-[0.92rem] text-ink placeholder:text-inkfaint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label
                htmlFor={`${role.id}-password`}
                className="block text-[0.8rem] font-medium text-inksoft mb-1.5"
              >
                Password
              </label>
              <input
                id={`${role.id}-password`}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surfacealt text-[0.92rem] text-ink placeholder:text-inkfaint focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Log in as {role.tag}
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
            <img src={logo} alt="CareSync logo" className="h-9 w-auto" />
          </a>
          <a
            href="/"
            className="text-sm font-medium text-inksoft hover:text-brand-blue transition-colors"
          >
            ← Back to home
          </a>
        </div>
      </header>

      <main className="max-w-content mx-auto px-6 md:px-8 py-13 md:pt-15 pb-30">
        <div className="text-center max-w-[52ch] mx-auto mb-14">
          <p className="eyebrow justify-center flex">Log in</p>
          <h1 className="text-[clamp(1.9rem,1.4rem+2vw,2.75rem)] font-display font-medium text-ink mb-3">
            Pick how you use CareSync
          </h1>
          <p className="text-inksoft">
            Each login opens a different view — choose the one that's yours.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <RoleLoginCard key={role.id} role={role} />
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-[0.92rem] text-inksoft">
          Not registered yet?{" "}
    
          <a href="/register"
            className="font-semibold text-brand-blue hover:text-brand-bluedeep underline underline-offset-4">
            Sign up
          </a>
          </p>
        </div>
      </main>
    </div>
  );
}



