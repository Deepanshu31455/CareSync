import logo from "../assets/NewLogo.png";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { logout } from "../redux/authSlice";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { API_BASE } from "../config";


// A photo can be saved as a plain link or as an object like { url } / { secure_url }.
function photoUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.url || value.secure_url || null;
}

// Finds the profile photo anywhere inside a profile response, whatever the response is called.
function findPhoto(data, depth = 0) {
  if (!data || typeof data !== "object" || depth > 4) return null;
  if ("profilePhoto" in data) return photoUrl(data.profilePhoto);
  for (const value of Object.values(data)) {
    const found = findPhoto(value, depth + 1);
    if (found) return found;
  }
  return null;
}

export default function FirstPage_Navbar() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.authStore.user);
  const [menuOpen, setMenuOpen] = useState(false);

  // The photo in the login data can be missing or out of date, so the profile is asked for it once.
  const [fetchedPhoto, setFetchedPhoto] = useState(null);
  const role = user?.role;
  useEffect(() => {
    if (!role) {
      setFetchedPhoto(null);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/${role}/profile`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setFetchedPhoto(findPhoto(data)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [role]);

  const photo = fetchedPhoto || photoUrl(user?.profilePhoto);
  const initial = (user?.name || user?.fullName || "U").charAt(0).toUpperCase();

  async function handleLogout() {
    try {
      const res = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Logout failed");
        return;
      }

      dispatch(logout());
      setMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-md border-b border-border">

      {/* ================= TOP NAVBAR ================= */}
      <div className="max-w-content mx-auto px-6 md:px-8 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="shrink-0" aria-label="CareSync home">
          <img
            src={logo}
            alt="CareSync logo"
            className="h-10 w-auto"
          />
        </Link>

        {/* ================= MOBILE HAMBURGER ================= */}
        <div className="min-[460px]:hidden">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </div>

        

        {/* ================= DESKTOP NAVBAR ================= */}
        <nav className="hidden min-[460px]:flex items-center gap-4 md:gap-6">

          <a
            href="#contact"
            className="font-medium text-inksoft hover:text-brand-blue transition-colors"
          >
            Contact
          </a>

          {user ? (
            <>
              <Link to="/profile">
                <div className="w-9 h-9 rounded-full overflow-hidden">
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${user.name || user.fullName || "User"} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-blue text-white font-semibold">
                      {initial}
                    </div>
                  )}
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="font-semibold px-5 py-2.5 rounded-full bg-ink text-white transition-all duration-150 hover:bg-brand-bluedeep hover:-translate-y-0.5"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="font-semibold px-5 py-2.5 rounded-full bg-ink text-white transition-all duration-150 hover:bg-brand-bluedeep hover:-translate-y-0.5"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>

{/* ================= MOBILE MENU ================= */}
{menuOpen && (
  <div className="min-[460px]:hidden w-full bg-bg border-t border-border">

    {/* Contact */}
    <a
      href="#contact"
      onClick={() => setMenuOpen(false)}
      className="block w-full px-6 py-4 text-base font-medium text-ink border-b border-border hover:bg-surfacealt transition-colors"
    >
      Contact
    </a>

    {user ? (
      <>
        {/* Profile */}
        <Link
          to="/profile"
          onClick={() => setMenuOpen(false)}
          className="block w-full px-6 py-4 text-base font-medium text-ink border-b border-border hover:bg-surfacealt transition-colors"
        >
          Profile
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="block w-full text-left px-6 py-4 text-base font-medium text-ink hover:bg-surfacealt transition-colors"
        >
          Log out
        </button>
      </>
    ) : (
      /* Login */
      <Link
        to="/login"
        onClick={() => setMenuOpen(false)}
        className="block w-full px-6 py-4 text-base font-medium text-ink hover:bg-surfacealt transition-colors"
      >
        Log in
      </Link>
    )}

  </div>
)}
    </header>
  );
}