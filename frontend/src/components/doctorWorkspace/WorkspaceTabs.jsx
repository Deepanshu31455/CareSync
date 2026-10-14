import { NavLink } from "react-router-dom";
import { Building2, Video } from "lucide-react";

// The doctor's two workspaces. Each one is its own address.
const TABS = [
  { to: "/dashboard/doctor/physical", label: "Physical visits", icon: Building2 },
  { to: "/dashboard/doctor/video", label: "Video visits", icon: Video },
];

export default function WorkspaceTabs() {
  return (
    <nav className="flex gap-2" aria-label="Workspace">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
              isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`
          }
        >
          <Icon size={16} /> {label}
        </NavLink>
      ))}
    </nav>
  );
}
