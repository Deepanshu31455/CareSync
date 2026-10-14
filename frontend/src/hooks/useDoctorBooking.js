import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// One doctor's page and the three steps of booking.
//   doctorId  the doctor's 6-digit ID
// Returns the doctor, the bookable days and the actions:
//   startPayment(date)  -> the payment to pay (or null on failure; see `error`)
//   pay(paymentId)      -> the booking with its token number (or null on failure)
export default function useDoctorBooking(doctorId) {
  const [doctor, setDoctor] = useState(null);
  const [days, setDays] = useState([]); // [{ date, weekday, open }] for the next two weeks
  const [today, setToday] = useState(null); // { date, nowServing, waiting }
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);

  async function loadDoctor() {
    try {
      setLoading(true);
      setError(null);

      // GET /doctors/:doctorId -> { doctor, days, today }
      const res = await fetch(`${API_BASE}/doctors/${doctorId}`, { method: "GET", credentials: "include" });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not load the doctor.");

      setDoctor(result.doctor);
      setDays(result.days || []);
      setToday(result.today || null);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  // Step 1: ask the server to prepare the payment for this day
  async function startPayment(date) {
    try {
      setWorking(true);
      setError(null);

      // POST /patient/bookings/checkout { doctorId, date } -> { mode, payment }
      const res = await fetch(`${API_BASE}/patient/bookings/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, date, type: "physical" }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not start the booking.");
      return { mode: result.mode, payment: result.payment };
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return null;
    } finally {
      setWorking(false);
    }
  }

  // Step 2: pay. (In demo mode this only marks the payment as paid; no money moves.)
  async function pay(paymentId) {
    try {
      setWorking(true);
      setError(null);

      // POST /patient/bookings/:paymentId/confirm -> { booking }
      const res = await fetch(`${API_BASE}/patient/bookings/${paymentId}/confirm`, {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not complete the booking.");
      return result.booking;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return null;
    } finally {
      setWorking(false);
    }
  }

  return { doctor, days, today, loading, working, error, setError, reload: loadDoctor, startPayment, pay };
}
