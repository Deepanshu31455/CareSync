import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// Doctor search for patients. Runs again (after a short pause while typing) when anything changes.
//   text            name or specialization
//   date            "2026-10-13": which day the patient wants
//   consultingOnly  true = hide doctors who do not consult that day
// Returns { doctors, loading, error, retry }.
//   doctor = { id (6-digit), fullName, specialization, consultationFee, open, queue: { nowServing, waiting } | null, ... }
export default function useDoctorSearch({ text, date, consultingOnly }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0); // goes up on "Retry"

  useEffect(() => {
    const controller = new AbortController(); // a newer search cancels this one
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams({ date });
        if (text.trim().length >= 2) query.set("q", text.trim());
        if (consultingOnly) query.set("consulting", "1");

        // GET /doctors/search?q=...&date=...&consulting=1  ->  { doctors }
        const res = await fetch(`${API_BASE}/doctors/search?${query}`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.message || "Could not search doctors.");
        setDoctors(result.doctors || []);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Could not connect to the server.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, date, consultingOnly, attempt]);

  return { doctors, loading, error, retry: () => setAttempt((n) => n + 1) };
}
