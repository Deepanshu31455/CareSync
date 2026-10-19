import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Clock, Video } from "lucide-react";

import { Card, Messages } from "../shared/ui";
import ConfirmDialog from "../shared/ConfirmDialog";
import { CONNECTION } from "../queueDesk/constants";
import { formatDay, formatTimeIST, todayIST } from "../../utils/dates";

// "My video visits": the time the doctor gave, and the "I am available" button for when it is time.
//   visits, connection, notice, error  come from useVideoVisits
export default function MyVideoPanel({ visits, connection, notice, error, onAvailable, onCancel }) {
  const [asking, setAsking] = useState(null); // the visit the patient wants to cancel
  const [busy, setBusy] = useState(null); // id of the visit being changed
  const [now, setNow] = useState(Date.now());

  // The buttons depend on the time, so the screen looks at the clock every 20 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(timer);
  }, []);

  if (visits.length === 0 && !notice && !error) return null;

  const status = CONNECTION[connection] || CONNECTION.connecting;
  const today = todayIST(now);

  async function toggle(visit) {
    setBusy(visit.visitId);
    await onAvailable(visit.visitId, !visit.ready);
    setBusy(null);
  }

  async function confirmCancel() {
    setBusy(asking.visitId);
    await onCancel(asking.visitId);
    setBusy(null);
    setAsking(null);
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-slate-900">
          <Video size={20} /> My video visits
        </h2>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${status.className}`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.label}
        </span>
      </div>

      <Messages success={notice} error={error} />

      <ul className="mt-3 space-y-3">
        {visits.map((visit) => {
          const isToday = visit.date === today;
          const inCall = visit.status === "in_consultation";
          const canMark = isToday && visit.scheduledAt && now >= new Date(visit.availableFrom).getTime();

          return (
            <li
              key={visit.visitId}
              className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                inCall ? "border-green-300 bg-green-50" : visit.ready ? "border-blue-200 bg-blue-50/40" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white">
                  <span className="text-[10px] uppercase tracking-wide text-slate-300">Token</span>
                  <span className="font-serif text-2xl font-bold leading-none">{visit.tokenNumber}</span>
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">Dr. {visit.doctor.fullName}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <CalendarClock size={12} /> {isToday ? "Today" : formatDay(visit.date)} · {visit.doctor.specialization}
                  </p>

                  {inCall ? (
                    <p className="mt-1 text-sm font-semibold text-green-700">The doctor has started your call.</p>
                  ) : visit.scheduledAt ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-700">
                      <Clock size={14} /> Expected time: <span className="font-semibold">{formatTimeIST(visit.scheduledAt)}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">The doctor will set your time soon.</p>
                  )}

                  {!inCall && isToday && visit.scheduledAt && !canMark && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      You can mark yourself available from {formatTimeIST(visit.availableFrom)}.
                    </p>
                  )}
                  {!inCall && visit.ready && (
                    <p className="mt-0.5 text-xs font-semibold text-blue-700">You are marked available. Keep this page open.</p>
                  )}
                  {!inCall && !isToday && <p className="mt-0.5 text-xs text-slate-400">You can mark yourself available on the day.</p>}
                </div>
              </div>

              {inCall && (
                <Link to={`/video-call/${visit.visitId}`} className="flex items-center gap-1.5 self-start rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  <Video size={15} /> Join call
                </Link>
              )}

              {!inCall && (
                <div className="flex flex-wrap gap-2">
                  {isToday && (
                    <button
                      onClick={() => toggle(visit)}
                      disabled={busy === visit.visitId || (!visit.ready && !canMark)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                        visit.ready ? "border border-slate-300 text-slate-700 hover:bg-slate-50" : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {visit.ready ? "Not available now" : "I am available"}
                    </button>
                  )}
                  <button
                    onClick={() => setAsking(visit)}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-700 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {asking && (
        <ConfirmDialog
          title="Cancel this video visit?"
          message={`Token ${asking.tokenNumber} with Dr. ${asking.doctor.fullName}. A refund is requested and the clinic will return the amount.`}
          confirmText="Cancel visit"
          busy={busy === asking.visitId}
          onConfirm={confirmCancel}
          onCancel={() => setAsking(null)}
        />
      )}
    </Card>
  );
}
