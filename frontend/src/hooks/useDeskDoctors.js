import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// The doctors this receptionist works for (only the ones that accepted them).
//   doctors  [{ id (6-digit), fullName, specialization, profilePhoto, ... }]
export default function useDeskDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      // GET /receptionist/doctors -> { doctors: [{ assignmentId, since, doctor }], requests }
      const res = await fetch(`${API_BASE}/receptionist/doctors`, { method: "GET", credentials: "include" });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not load your doctors.");

      setDoctors((result.doctors || []).map((row) => row.doctor).filter((doctor) => doctor?.id));
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { doctors, loading, error, reload: load };
}
