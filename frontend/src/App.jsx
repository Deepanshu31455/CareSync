import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import "./App.css";

// Public pages
import FirstPage from "./pages/FirstPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TrustAndLegal from "./pages/TrustAndLegalPage";
import AssignmentResponse from "./pages/AssignmentResponse";
import VideoCall from "./pages/VideoCall";

// Logged-in pages
import DoctorProfile from "./pages/DoctorProfile";
import DoctorPhysical from "./pages/DoctorPhysical";
import DoctorVideo from "./pages/DoctorVideo";
import PatientProfile from "./pages/PatientProfile";
import SearchDoctors from "./pages/SearchDoctors";
import ReceptionistProfile from "./pages/ReceptionistProfile";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import SocketTest from "./pages/SocketTest";

// Route guards
import ProtectedRoute from "./components/ProtectedRoutes";
import PublicOnly from "./components/PublicRoutes";

// The profile page of each role.
const PROFILES = {
  doctor: DoctorProfile,
  patient: PatientProfile,
  receptionist: ReceptionistProfile,
};

// Shows the page that belongs to the logged-in user's role.
// The role comes from the login (Redux), not from the URL, so a user
// cannot open another role's page by typing its address.
function ByRole({ pages }) {
  const role = useSelector((state) => state.authStore.user?.role);
  const Page = pages[role];

  return Page ? <Page /> : <Navigate to="/" replace />; // no page for this role yet
}

// Lets only the given role see a page; everyone else goes to the first page.
function OnlyRole({ role, children }) {
  const current = useSelector((state) => state.authStore.user?.role);
  return current === role ? children : <Navigate to="/" replace />;
}

// Logged in AND the right role, in one wrapper
function Page({ role, children }) {
  return (
    <ProtectedRoute>
      <OnlyRole role={role}>{children}</OnlyRole>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  // ─── Public ────────────────────────────────────────────────────────────────
  { path: "/", element: <FirstPage /> },
  { path: "/TrustAndLegal", element: <TrustAndLegal /> },

  // Opened from the email a doctor gets. No login needed: the token in the link is the proof.
  { path: "/assignment/respond", element: <AssignmentResponse /> },

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

  // ─── Doctor: two workspaces ────────────────────────────────────────────────
  // "Go to work" opens /dashboard/doctor, which leads to the physical visits.
  { path: "/dashboard/doctor", element: <Navigate to="/dashboard/doctor/physical" replace /> },
  {
    path: "/dashboard/doctor/physical",
    element: (
      <Page role="doctor">
        <DoctorPhysical />
      </Page>
    ),
  },
  {
    path: "/dashboard/doctor/video",
    element: (
      <Page role="doctor">
        <DoctorVideo />
      </Page>
    ),
  },
  { 
   path: "/video-call/:visitId",
   element: 
   <ProtectedRoute>
       <VideoCall />
   </ProtectedRoute> 
   },


  // ─── Receptionist ──────────────────────────────────────────────────────────
  {
    path: "/dashboard/receptionist",
    element: (
      <Page role="receptionist">
        <ReceptionistDashboard />
      </Page>
    ),
  },

  // ─── Patient ───────────────────────────────────────────────────────────────
  {
    path: "/search",
    element: (
      <Page role="patient">
        <SearchDoctors />
      </Page>
    ),
  },

  // ─── Any logged-in user ────────────────────────────────────────────────────
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ByRole pages={PROFILES} />
      </ProtectedRoute>
    ),
  },

  // Temporary: remove when you have finished testing the live connection
  {
    path: "/socket-test",
    element: (
      <ProtectedRoute>
        <SocketTest />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;