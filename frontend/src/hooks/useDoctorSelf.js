import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// The logged-in doctor: their 6-digit ID (used to open their queue) and name.
export default function useDoctorSelf() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      // GET /doctor/profile -> { doctor }
      const res = await fetch(`${API_BASE}/doctor/profile`, { method: "GET", credentials: "include" });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not load your profile.");
      setDoctor(result.doctor);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { doctor, loading, error, reload: load };
}
