import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import "./App.css";

// Public pages
import FirstPage from "./pages/FirstPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TrustAndLegal from "./pages/TrustAndLegalPage";

// Logged-in pages
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import PatientProfile from "./pages/PatientProfile";

// Route guards
import ProtectedRoute from "./components/ProtectedRoutes";
import PublicOnly from "./components/PublicRoutes";

// Which page each role sees. To add a page later (for example a patient
// dashboard), add one line here.
const DASHBOARDS = {
  doctor: DoctorDashboard,
};

const PROFILES = {
  doctor: DoctorProfile,
  patient: PatientProfile,
};

// Shows the page that belongs to the logged-in user's role.
// The role comes from the login (Redux), not from the URL, so a user
// cannot open another role's page by typing its address.
function ByRole({ pages }) {
  const role = useSelector((state) => state.authStore.user?.role);
  const Page = pages[role];

  return Page ? <Page /> : <Navigate to="/" replace />; // no page for this role yet
}

const router = createBrowserRouter([
  // ─── Public ────────────────────────────────────────────────────────────────
  { path: "/", element: <FirstPage /> },
  { path: "/TrustAndLegal", element: <TrustAndLegal /> },

  // ─── Logged-out users only ─────────────────────────────────────────────────
  {
    path: "/register",
    element: (
      <PublicOnly>
        <RegisterPage />
      </PublicOnly>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },

  // ─── Logged-in users only ──────────────────────────────────────────────────
  {
    path: "/dashboard/:role",
    element: (
      <ProtectedRoute>
        <ByRole pages={DASHBOARDS} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ByRole pages={PROFILES} />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
