import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// What the doctor sees about one person in the queue.
//   doctorId       the doctor's 6-digit ID        appointmentId  the queue row that was opened
// Returns { info, loading, error }:
//   info = { walkIn: true }                                     (no records for walk-ins)
//   info = { walkIn: false, patient, consultations, prescriptions, reports }
export default function usePatientInfo(doctorId, appointmentId) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doctorId || !appointmentId) {
      setInfo(null);
      return;
    }

    const controller = new AbortController(); // opening another person cancels this request
    setInfo(null);
    setError(null);
    setLoading(true);

    async function load() {
      try {
        // GET /queue/:doctorId/appointments/:id/patient
        const res = await fetch(`${API_BASE}/queue/${doctorId}/appointments/${appointmentId}/patient`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.message || "Could not load the patient's information.");
        setInfo(result);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Could not connect to the server.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();

    return () => controller.abort();
  }, [doctorId, appointmentId]);

  return { info, loading, error };
}
