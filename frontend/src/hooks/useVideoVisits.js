import { useCallback, useEffect, useState } from "react";

import { socket } from "../socket";
import { API_BASE } from "../config";

const FALLBACK_POLL_MS = 15000; // refresh by plain requests while the live connection is down

// The patient's coming video visits: the time the doctor gave, and "I am available".
//   Live: the server sends "video:changed" to this patient's own private room when the doctor
//   gives a time or changes the visit; the screen then loads the list again (it is short),
//   so a missed message can never leave it wrong.
// Returns { visits, loading, error, notice, connection, reload, setAvailable(id, bool), cancel(id) }
export default function useVideoVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [connection, setConnection] = useState("connecting");

  const load = useCallback(async () => {
    try {
      // GET /patient/video-visits -> { visits: [{ visitId, date, tokenNumber, status, scheduledAt, availableFrom, ready, peopleAhead, doctor }] }
      const res = await fetch(`${API_BASE}/patient/video-visits`, { method: "GET", credentials: "include" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not load your video visits.");
      setVisits(result.visits || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live connection
  useEffect(() => {
    const onChanged = () => load();
    const goLive = () => {
      setConnection("live");
      load(); // anything missed while disconnected
    };
    const goOffline = () => setConnection("offline");

    socket.on("video:changed", onChanged);
    socket.on("connect", goLive);
    socket.on("disconnect", goOffline);
    socket.on("connect_error", goOffline);

    if (socket.connected) setConnection("live");
    else socket.connect();

    const poll = setInterval(() => {
      if (!socket.connected && !document.hidden) load();
    }, FALLBACK_POLL_MS);

    return () => {
      clearInterval(poll);
      socket.off("video:changed", onChanged);
      socket.off("connect", goLive);
      socket.off("disconnect", goOffline);
      socket.off("connect_error", goOffline);
    };
  }, [load]);

  // Is the patient available now? (true) or take it back (false)
  async function setAvailable(visitId, available) {
    try {
      setNotice(null);
      setError(null);

      // POST /patient/video-visits/:id/available { available }
      const res = await fetch(`${API_BASE}/patient/video-visits/${visitId}/available`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not update your availability.");

      setVisits((previous) => previous.map((v) => (v.visitId === visitId ? { ...v, ready: result.ready } : v)));
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    }
  }

  async function cancel(visitId) {
    try {
      setNotice(null);
      setError(null);

      // POST /patient/video-visits/:id/cancel -> { message }
      const res = await fetch(`${API_BASE}/patient/video-visits/${visitId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not cancel the visit.");

      setNotice(result.message);
      await load();
      return true;
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
      return false;
    }
  }

  return { visits, loading, error, notice, connection, reload: load, setAvailable, cancel };
}
