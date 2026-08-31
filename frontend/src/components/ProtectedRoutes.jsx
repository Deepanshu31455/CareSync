import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useSelector(
    (state) => state.authStore
  );

  // We are still checking whether the user is logged in
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in → don't allow access
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → allow the page to render
  return children;
}