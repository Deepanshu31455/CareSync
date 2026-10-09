import { Link } from "react-router-dom";
import { LayoutDashboard, Home, Edit3, Save, X } from "lucide-react";

const navLink =
  "flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";

export default function ProfileNavbar({
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <nav className="flex flex-wrap gap-2">
          <Link to='/dashboard/doctor' className={navLink}>
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          <Link to='/' className={navLink}>
            <Home size={16} />
            Home
          </Link>
        </nav>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={onCancel}
                disabled={saving}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
