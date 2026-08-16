import { ROLES } from "./RegisterPage_constants";
import { fieldBorder } from "../utils/utils";
import { ChevronDown } from "../components/icons";

export default function RoleStep({ role, setRole, register, error, menuOpen, setMenuOpen }) {
  const selected = ROLES.find((r) => r.id === role);

  return (
    <div>
      <input type="hidden" {...register("role", { required: "Please select a role" })} />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border bg-surfacealt text-left ${fieldBorder(error)}`}
        >
          <span className={selected ? "text-ink font-medium" : "text-inkfaint"}>
            {selected ? selected.label : "Select your role"}
          </span>
          <ChevronDown open={menuOpen} />
        </button>

        {menuOpen && (
          <ul className="absolute z-10 mt-2 w-full bg-surface border border-border rounded-xl shadow-card overflow-hidden">
            {ROLES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setRole(r.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 font-medium text-ink transition-colors hover:bg-surfacealt ${role === r.id ? "bg-surfacealt" : ""}`}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-[0.78rem] text-brand-coral mt-1.5">{error.message}</p>}
    </div>
  );
}
