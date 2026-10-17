import { NavLink, Link } from "react-router-dom";
import { Home, LayoutDashboard } from "lucide-react";

// The top bar of the doctor's pages: Dashboard (the workspace) and Home (the website's first page).
export default function DoctorNavbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="font-serif text-lg font-semibold text-slate-900">
          CareSync
        </Link>
        <nav className="flex gap-2" aria-label="Main">
          <NavLink
            to="/dashboard/doctor/physical"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            <Home size={16} /> Home
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
