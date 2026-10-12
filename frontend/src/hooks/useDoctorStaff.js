import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// The doctor's receptionists and the requests waiting for an answer.
// Kept in the component (not Redux): it is only shown in the Clinic Staff section.
//
//  GET    /doctor/staff          -> { receptionists, requests }
//  PUT    /doctor/requests/:id   { action: "accept" | "reject" }
//  DELETE /doctor/staff/:id      (ends the assignment)
//
//  receptionists[] { assignmentId, since, receptionist: { fullName, profilePhoto, email, phone } }
//  requests[]      { assignmentId, requestedAt, expiresAt, expired, receptionist: { fullName, profilePhoto, email } }
export default function useDoctorStaff() {
  const [receptionists, setReceptionists] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/doctor/staff`, { method: "GET", credentials: "include" });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not load your staff.");

      setReceptionists(result.receptionists || []);
      setRequests(result.requests || []);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Accept or decline a pending request
  async function respond(assignmentId, action) {
    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE}/doctor/requests/${assignmentId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not answer the request.");

      setMessage(result.message);
      await load(); // an accepted receptionist moves to the staff list
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  // End the assignment with a receptionist
  async function remove(assignmentId) {
    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE}/doctor/staff/${assignmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not remove the receptionist.");

      setReceptionists((prev) => prev.filter((r) => r.assignmentId !== assignmentId));
      setMessage(result.message);
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { receptionists, requests, loading, busy, error, message, reload: load, respond, remove };
}
