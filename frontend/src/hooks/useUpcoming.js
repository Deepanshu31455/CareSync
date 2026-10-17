import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config";

// How many people are waiting on each coming day (counts only), for the doctor or the receptionist.
//   doctorId  the doctor's 6-digit ID
// Returns days = [{ date, count }]. It is asked again every minute, and when the tab becomes visible again.
export default function useUpcoming(doctorId) {
  const [days, setDays] = useState([]);

  const load = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res = await fetch(`${API_BASE}/queue/${doctorId}/upcoming`, { credentials: "include" });
      const result = await res.json();
      if (res.ok) setDays(result.days || []);
    } catch {
      // keep what is shown; the next round tries again
    }
  }, [doctorId]);

  useEffect(() => {
    setDays([]);
    load();
    const timer = setInterval(() => !document.hidden && load(), 60 * 1000);
    const onVisible = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { days, reload: load };
}
