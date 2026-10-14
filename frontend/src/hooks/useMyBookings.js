import { useEffect, useRef, useState } from "react";

import { socket } from "../socket";
import { API_BASE } from "../config";
import { todayIST } from "../utils/dates";

const FALLBACK_POLL_MS = 10000; // refresh by plain requests while the live connection is down

// The patient's upcoming bookings, and for today's ones the live queue (who is being served now).
//
// How today's queue stays live:
//   - the server sends the public summary of each queue: the token being served and the token
//     numbers of everyone waiting (numbers only, never names)
//   - from that list the screen works out "people ahead of you" itself: no extra request per change
//   - when the list no longer contains the patient's token, the booking changed (called in, cancelled,
//     rescheduled...), so the bookings are loaded again
//
// Returns { bookings, live(booking), loading, error, connection, reload, cancel }
export default function useMyBookings() {
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState({}); // "355555:2026-10-13" -> { nowServing, waiting, waitingTokens }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [today, setToday] = useState(todayIST());
  const [notice, setNotice] = useState(null);
  const bookingsRef = useRef([]);
  bookingsRef.current = bookings;

  /* ---------- bookings ---------- */

  async function load() {
    try {
      // GET /patient/bookings -> { bookings: [{ appointmentId, date, tokenNumber, status, doctor }] }
      const res = await fetch(`${API_BASE}/patient/bookings`, { method: "GET", credentials: "include" });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not load your bookings.");
      setBookings(result.bookings || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // "Today" is checked every minute, so the panel moves on after midnight
  useEffect(() => {
    const timer = setInterval(() => setToday(todayIST()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------- live queues of today's bookings ---------- */

  // One entry per doctor and day, for today only: "355555:2026-10-13"
  const roomsKey = [...new Set(bookings.filter((b) => b.date === today).map((b) => `${b.doctor.id}:${b.date}`))]
    .sort()
    .join(",");

  useEffect(() => {
    if (!roomsKey) {
      setNow({});
      return;
    }

    const rooms = roomsKey.split(","); // ["355555:2026-10-13"]
    const keyOfDatabaseId = {}; // the server names the doctor by database id in live messages
    const lastSeq = {};
    let active = true;

    async function loadSnapshot(key) {
      const [doctorId, date] = key.split(":");
      try {
        // GET /queue/:doctorId/now?date=... -> { nowServing, waiting, waitingTokens, seq }
        const res = await fetch(`${API_BASE}/queue/${doctorId}/now?date=${date}`, { method: "GET", credentials: "include" });
        const result = await res.json();
        if (!res.ok || !active) return;

        if (lastSeq[key] === undefined || result.seq >= lastSeq[key]) {
          lastSeq[key] = result.seq;
          setNow((previous) => ({ ...previous, [key]: result }));
        }
      } catch {
        /* the next poll or live message will fix it */
      }
    }

    function joinAll() {
      rooms.forEach((key) => {
        const [doctorId, date] = key.split(":");
        socket.emit("queue:join", { kind: "now", doctorId, date }, (reply) => {
          if (!active || !reply?.ok) return;
          keyOfDatabaseId[reply.doctorId] = key;
          setConnection("live");
          loadSnapshot(key);
        });
      });
    }

    // One live message: the newest summary of one queue
    function onNowServing(message) {
      const key = keyOfDatabaseId[message.doctorId];
      if (!key || message.date !== key.split(":")[1]) return;
      if (lastSeq[key] !== undefined && message.seq <= lastSeq[key]) return;

      lastSeq[key] = message.seq;
      setNow((previous) => ({
        ...previous,
        [key]: { nowServing: message.token, waiting: message.waiting, waitingTokens: message.waitingTokens || [] },
      }));
    }

    const goOffline = () => setConnection("offline");

    socket.on("connect", joinAll);
    socket.on("disconnect", goOffline);
    socket.on("connect_error", goOffline);
    socket.on("now:serving", onNowServing);

    if (socket.connected) joinAll();
    else socket.connect();

    const poll = setInterval(() => {
      if (!socket.connected) {
        rooms.forEach(loadSnapshot);
        load();
      }
    }, FALLBACK_POLL_MS);

    return () => {
      active = false;
      clearInterval(poll);
      socket.off("connect", joinAll);
      socket.off("disconnect", goOffline);
      socket.off("connect_error", goOffline);
      socket.off("now:serving", onNowServing);
      rooms.forEach((key) => {
        const [doctorId, date] = key.split(":");
        socket.emit("queue:leave", { kind: "now", doctorId, date });
      });
    };
  }, [roomsKey]);

  /* ---------- what each booking looks like right now ---------- */

  // state: "your_turn" | "waiting" | "changed" | "unknown"; ahead = people before the patient
  function live(booking) {
    const summary = now[`${booking.doctor.id}:${booking.date}`];
    if (booking.status === "in_consultation") return { state: "your_turn", nowServing: booking.tokenNumber };
    if (!summary) return { state: "unknown" };

    const tokens = summary.waitingTokens || [];
    if (summary.nowServing === booking.tokenNumber) return { state: "your_turn", nowServing: summary.nowServing };
    if (tokens.includes(booking.tokenNumber)) {
      return { state: "waiting", nowServing: summary.nowServing, ahead: tokens.filter((t) => t < booking.tokenNumber).length };
    }
    // a very long queue lists only the first tokens: a later token is still waiting
    if (summary.waiting > tokens.length && booking.tokenNumber > tokens[tokens.length - 1]) {
      return { state: "waiting", nowServing: summary.nowServing, ahead: tokens.length };
    }
    return { state: "changed", nowServing: summary.nowServing };
  }

  // A booking that is no longer waiting (called in, completed, cancelled...): load the bookings again.
  // Runs when a live summary arrives, not after every reload, so it cannot loop.
  useEffect(() => {
    const changed = bookingsRef.current.some((b) => b.date === today && live(b).state === "changed");
    if (!changed) return;
    const timer = setTimeout(load, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  /* ---------- actions ---------- */

  async function cancel(appointmentId) {
    try {
      setNotice(null);
      setError(null);

      // POST /patient/bookings/:appointmentId/cancel -> { message }
      const res = await fetch(`${API_BASE}/patient/bookings/${appointmentId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not cancel the booking.");

      setNotice(result.message);
      await load();
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    }
  }

  return { bookings, live, loading, error, notice, connection, today, reload: load, cancel };
}
