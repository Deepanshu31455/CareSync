import FirstPage from "./pages/FirstPage";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TrustAndLegal from "./pages/TrustAndLegalPage";

import ProtectedRoute from "./components/ProtectedRoutes";
import PublicOnly from "./components/PublicRoutes";
import DoctorDashboard from "./pages/DoctorDashboard";

import "./App.css";
import DoctorProfile from "./pages/DoctorProfile";


const router = createBrowserRouter([
  {
    path: "/",
    element: <FirstPage />,
  },
  {
    path:"/TrustAndLegal",
    element:<TrustAndLegal/>
  },

  // Only logged-out users can access these
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

  // Example protected route
  {
    path: "/dashboard/:role",
    element: (
      <ProtectedRoute>
        <DoctorDashboard />
      </ProtectedRoute>
    ),
  },

  // Doctor profile — protected, doctor only
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <DoctorProfile />
      </ProtectedRoute>
    ),
  },
]);


function App() {
  return <RouterProvider router={router} />;
}

export default App;