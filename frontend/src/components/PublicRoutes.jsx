import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PublicOnly({ children }) {
  const { user, loading } = useSelector(
    (state) => state.authStore
  );
  // Still checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Already logged in → don't show login/register
  if (user) {
    return (
      <Navigate
        to={`/dashboard/${user.role}`}
        replace
      /> 
    );
  }

  // Not logged in → allow login/register
  return children;
}