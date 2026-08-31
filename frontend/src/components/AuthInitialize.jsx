import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading,setUser } from "../redux/authSlice";
export default function AuthInitialize({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/v1/me",
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