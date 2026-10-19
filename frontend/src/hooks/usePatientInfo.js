import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// What the doctor sees about one person in the queue.
//   doctorId       the doctor's 6-digit ID        appointmentId  the queue row that was opened
//   mode           "physical" (default) or "video": a video visit is opened by its own address
// Returns { info, loading, error }:
//   info = { walkIn: true }                                     (no records for walk-ins)
//   info = { walkIn: false, patient, consultations, prescriptions, reports }
export default function usePatientInfo(doctorId, appointmentId, mode = "physical") {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ((mode !== "video" && !doctorId) || !appointmentId) {
      setInfo(null);
      return;
    }

    const controller = new AbortController(); // opening another person cancels this request
    setInfo(null);
    setError(null);
    setLoading(true);

    async function load() {
      try {
        // GET /queue/:doctorId/appointments/:id/patient   or   GET /doctor/video/visits/:id/patient
        const url =
          mode === "video"
            ? `${API_BASE}/doctor/video/visits/${appointmentId}/patient`
            : `${API_BASE}/queue/${doctorId}/appointments/${appointmentId}/patient`;
        const res = await fetch(url, {
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
  }, [doctorId, appointmentId, mode]);

  return { info, loading, error };
}
