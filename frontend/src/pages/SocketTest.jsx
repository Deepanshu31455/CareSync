import { useEffect, useState } from "react";
import { socket } from "../socket";
import { API_BASE } from "../config";

// TEMPORARY page to check the live connection. Delete it (and its route) once the queue is built.
// 1. Open it while logged in.   2. "Send test message" -> a line "socket:test" should appear.
// 3. Type a doctor id and "Join": "now" rooms accept anyone logged in; "queue" rooms only the
//    doctor or an assigned receptionist (others see an error).
const today = new Date().toISOString().slice(0, 10);

export default function SocketTest() {
  const [status, setStatus] = useState("connecting...");
  const [log, setLog] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [kind, setKind] = useState("now");

  const add = (line) => setLog((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 30));

  useEffect(() => {
    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onError = (err) => setStatus(`cannot connect: ${err.message}`);
    const onTest = (data) => add(`socket:test  ${JSON.stringify(data)}`);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);
    socket.on("socket:test", onTest);
    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.off("socket:test", onTest);
    };
  }, []);

  async function sendTest() {
    try {
      const res = await fetch(`${API_BASE}/socket/test`, { method: "POST", credentials: "include" });
      const result = await res.json();
      add(`server replied: ${JSON.stringify(result)}`);
    } catch (err) {
      add(`request failed: ${err.message}`);
    }
  }

  function join() {
    socket.emit("queue:join", { kind, doctorId: doctorId.trim(), date: today }, (reply) =>
      add(`join ${kind}: ${JSON.stringify(reply)}`)
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6 text-sm">
      <h1 className="font-serif text-xl font-semibold">Live connection test</h1>
      <p>Status: <b>{status}</b></p>

      <button onClick={sendTest} className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white">
        Send test message
      </button>

      <div className="flex flex-wrap gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-xl border px-3 py-2">
          <option value="now">now (any user)</option>
          <option value="queue">queue (doctor / assigned receptionist)</option>
        </select>
        <input
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          placeholder="doctor _id"
          className="min-w-0 flex-1 rounded-xl border px-3 py-2"
        />
        <button onClick={join} className="rounded-full border px-4 py-2">Join</button>
      </div>

      <pre className="min-h-32 whitespace-pre-wrap rounded-xl bg-slate-100 p-3 text-xs">{log.join("\n") || "No messages yet."}</pre>
    </main>
  );
}
