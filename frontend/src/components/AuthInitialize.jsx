import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading,setUser } from "../redux/authSlice";
import { API_BASE } from "../config";
export default function AuthInitialize({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          dispatch(setUser(null));
          return;
        }

        const data = await response.json();

        dispatch(setUser(data.dataforslice));

      } catch (error) {
        console.error("Auth initialization failed:", error);
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  return children;
}