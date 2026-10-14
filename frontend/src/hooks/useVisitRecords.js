import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config";

// The tests, reports and bills of ONE visit, for the receptionist.
//   doctorId       the doctor's 6-digit ID
//   appointmentId  the visit (appointment)
// upload(kind, form, file) and remove(kind, id) return true on success, false on failure.
export default function useVisitRecords(doctorId, appointmentId) {
  const [records, setRecords] = useState({ prescriptions: [], reports: [], bills: [] });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const base = `${API_BASE}/queue/${doctorId}/appointments/${appointmentId}/records`;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(base, { credentials: "include" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not load the records.");
      setRecords({
        prescriptions: result.prescriptions || [],
        reports: result.reports || [],
        bills: result.bills || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(kind, fields, file) {
    try {
      setWorking(true);
      setError(null);
      setMessage(null);

      // FormData: the browser sets the Content-Type (with its boundary) by itself
      const data = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== "") data.append(key, value);
      });
      data.append("file", file);

      const res = await fetch(`${base}/${kind}`, { method: "POST", credentials: "include", body: data });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not upload.");

      setRecords((prev) => ({ ...prev, [kind]: [...prev[kind], result.item] }));
      setMessage(result.message);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setWorking(false);
    }
  }

  async function remove(kind, itemId) {
    try {
      setWorking(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`${base}/${kind}/${itemId}`, { method: "DELETE", credentials: "include" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not remove.");

      setRecords((prev) => ({ ...prev, [kind]: prev[kind].filter((item) => item.id !== itemId) }));
      setMessage(result.message);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setWorking(false);
    }
  }

  return { records, loading, working, error, message, upload, remove, reload: load };
}
