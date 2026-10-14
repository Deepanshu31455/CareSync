import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// What the receptionist can DO to a doctor's queue. (What the queue looks like comes from useQueue.)
//   doctorId    the doctor's 6-digit ID
//   refresh     asks for a fresh snapshot; used when the live connection is down
//   connection  "live" | "offline" | "connecting"
//
// Each action returns true on success and false on failure.
// The screen itself updates through the live connection, so nothing is stored here
// except the message to show and which action is running.
export default function useQueueDesk({ doctorId, refresh, connection }) {
  const [working, setWorking] = useState(null); // name of the running action, or null
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Hide messages after 4 seconds
  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);

  // Without the live connection nothing would be pushed, so ask for the new picture ourselves
  function afterChange() {
    if (connection !== "live" && refresh) refresh();
  }

  // Add a person without the app: { name, phone, age, gender }
  async function addWalkIn(form) {
    try {
      setWorking("add");
      setError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE}/queue/${doctorId}/walk-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not add the patient.");

      setMessage(result.message);
      afterChange();
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    } finally {
      setWorking(null);
    }
  }

  // Call the waiting person with the lowest token
  async function callNext() {
    try {
      setWorking("next");
      setError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE}/queue/${doctorId}/next`, {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not call the next patient.");

      setMessage(result.message);
      afterChange();
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    } finally {
      setWorking(null);
    }
  }

  // action: "start" (call this person now) | "complete" | "cancel" | "no_show"
  async function changeStatus(appointmentId, action) {
    try {
      setWorking(appointmentId);
      setError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE}/queue/${doctorId}/appointments/${appointmentId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not change the status.");

      afterChange();
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    } finally {
      setWorking(null);
    }
  }

  // Move a person to another day (or the end of today's queue). They get a new token.
  async function reschedule(appointmentId, newDate) {
    try {
      setWorking(appointmentId);
      setError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE}/queue/${doctorId}/appointments/${appointmentId}/reschedule`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not reschedule.");

      setMessage(result.message);
      afterChange();
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    } finally {
      setWorking(null);
    }
  }

  return { working, message, error, addWalkIn, callNext, changeStatus, reschedule };
}
