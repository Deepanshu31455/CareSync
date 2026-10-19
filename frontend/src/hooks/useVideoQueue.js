import { useCallback, useEffect, useRef, useState } from "react";

import { socket } from "../socket";
import { API_BASE } from "../config";

const FALLBACK_POLL_MS = 10000; // refresh by plain requests while the live connection is down

// The doctor's video queue for one day, and what the doctor can do with it.
//   date  "2026-10-19"
// Live: the server sends "video:changed" to the doctor's own private room when a patient books,
// marks themselves available or cancels; the list is then loaded again (it is short), so a missed
// message can never leave the screen wrong.
//
// Returns { items, upcoming, loading, error, connection, working, message, actionError,
//           setTime(id, "17:30" | null), scheduleAll(form), changeStatus(id, action), reload }
// Each action returns true on success and false on failure.
export default function useVideoQueue(date) {
  const [items, setItems] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [working, setWorking] = useState(null); // id of the visit being changed, or "schedule"
  const [message, setMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const dateRef = useRef(date);
  dateRef.current = date;

  const load = useCallback(async () => {
    try {
      // GET /doctor/video/queue?date=... -> { items: [{ visitId, tokenNumber, status, scheduledAt, ready, name, age, gender }] }
      const res = await fetch(`${API_BASE}/doctor/video/queue?date=${dateRef.current}`, { method: "GET", credentials: "include" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not load the video queue.");
      if (result.date !== dateRef.current) return; // the doctor already moved to another day
      setItems(result.items || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUpcoming = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/doctor/video/upcoming`, { method: "GET", credentials: "include" });
      const result = await res.json();
      if (res.ok) setUpcoming(result.days || []);
    } catch {
      /* the next change or poll tries again */
    }
  }, []);

  // A new day: show the spinner and load it
  useEffect(() => {
    setLoading(true);
    setItems([]);
    load();
    loadUpcoming();
  }, [date, load, loadUpcoming]);

  // Hide messages after 4 seconds
  useEffect(() => {
    if (!message && !actionError) return;
    const timer = setTimeout(() => {
      setMessage(null);
      setActionError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, actionError]);

  // Live connection
  useEffect(() => {
    let timer = null;
    const refresh = () => {
      clearTimeout(timer); // several changes close together load once
      timer = setTimeout(() => {
        load();
        loadUpcoming();
      }, 250);
    };
    const goLive = () => {
      setConnection("live");
      refresh(); // anything missed while disconnected
    };
    const goOffline = () => setConnection("offline");

    socket.on("video:changed", refresh);
    socket.on("connect", goLive);
    socket.on("disconnect", goOffline);
    socket.on("connect_error", goOffline);

    if (socket.connected) setConnection("live");
    else socket.connect();

    const poll = setInterval(() => {
      if (!socket.connected && !document.hidden) refresh();
    }, FALLBACK_POLL_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      socket.off("video:changed", refresh);
      socket.off("connect", goLive);
      socket.off("disconnect", goOffline);
      socket.off("connect_error", goOffline);
    };
  }, [load, loadUpcoming]);

  // One request to the server; the list is loaded again afterwards
  async function send(busyKey, path, method, body) {
    try {
      setWorking(busyKey);
      setMessage(null);
      setActionError(null);

      const res = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not do that.");

      if (result.message) setMessage(result.message);
      await Promise.all([load(), loadUpcoming()]);
      return true;
    } catch (err) {
      setActionError(err.message || "Could not connect to the server.");
      return false;
    } finally {
      setWorking(null);
    }
  }

  // PUT /doctor/video/visits/:id/time { time }
  const setTime = (visitId, time) => send(visitId, `/doctor/video/visits/${visitId}/time`, "PUT", { time });

  // POST /doctor/video/schedule { date, start, minutes, onlyUnscheduled }
  const scheduleAll = (form) => send("schedule", "/doctor/video/schedule", "POST", form);

  // PUT /doctor/video/visits/:id/status { action: "start" | "complete" | "cancel" | "no_show" }
  const changeStatus = (visitId, action) => send(visitId, `/doctor/video/visits/${visitId}/status`, "PUT", { action });

  return { items, upcoming, loading, error, connection, working, message, actionError, setTime, scheduleAll, changeStatus, reload: load };
}
