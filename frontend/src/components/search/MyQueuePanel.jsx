import { useState } from "react";
import { CalendarClock, MapPin } from "lucide-react";

import { Card, Messages } from "../shared/ui";
import ConfirmDialog from "../shared/ConfirmDialog";
import { CONNECTION } from "../queueDesk/constants";
import { formatDay } from "../../utils/dates";

// "My bookings": for today the live queue (token, who is being served, people ahead),
// for later days the date and token.
//   bookings, live(booking), connection, notice, error, today   come from useMyBookings
export default function MyQueuePanel({ bookings, live, connection, notice, error, today, onCancel }) {
  const [asking, setAsking] = useState(null); // the booking the patient wants to cancel
  const [busy, setBusy] = useState(false);

  if (bookings.length === 0 && !notice && !error) return null;

  const status = CONNECTION[connection] || CONNECTION.connecting;

  async function confirmCancel() {
    setBusy(true);
    await onCancel(asking.appointmentId);
    setBusy(false);
    setAsking(null);
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-slate-900">My bookings</h2>
        {bookings.some((b) => b.date === today) && (
          <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${status.className}`}>
            <span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.label}
          </span>
        )}
      </div>

      <Messages success={notice} error={error} />

      <ul className="mt-3 space-y-3">
        {bookings.map((booking) => {
          const isToday = booking.date === today;
          const state = isToday ? live(booking) : { state: "later" };
          const yourTurn = state.state === "your_turn";

          return (
            <li
              key={booking.appointmentId}
              className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                yourTurn ? "border-green-300 bg-green-50" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white">
                  <span className="text-[10px] uppercase tracking-wide text-slate-300">Token</span>
                  <span className="font-serif text-2xl font-bold leading-none">{booking.tokenNumber}</span>
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">Dr. {booking.doctor.fullName}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <CalendarClock size={12} /> {isToday ? "Today" : formatDay(booking.date)} · {booking.doctor.specialization}
                  </p>
                  {booking.doctor.clinicAddress && (
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={12} /> <span className="truncate">{booking.doctor.clinicAddress}</span>
                    </p>
                  )}

                  {yourTurn && <p className="mt-1 text-sm font-semibold text-green-700">It is your turn. Please go in.</p>}
                  {state.state === "waiting" && (
                    <p className="mt-1 text-sm text-slate-700">
                      {state.nowServing ? `Now serving ${state.nowServing}` : "Not started yet"} ·{" "}
                      <span className="font-semibold">
                        {state.ahead === 0 ? "you are next" : `${state.ahead} ${state.ahead === 1 ? "person" : "people"} ahead`}
                      </span>
                    </p>
                  )}
                  {state.state === "unknown" && <p className="mt-1 text-xs text-slate-400">Loading the queue...</p>}
                  {state.state === "later" && <p className="mt-1 text-xs text-slate-400">The live queue opens on the day.</p>}
                </div>
              </div>

              {booking.status === "waiting" && (
                <button
                  onClick={() => setAsking(booking)}
                  className="rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-700 hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {asking && (
        <ConfirmDialog
          title="Cancel this booking?"
          message={`Token ${asking.tokenNumber} with Dr. ${asking.doctor.fullName}. If you have paid, a refund is requested and the clinic will return the amount.`}
          confirmText="Cancel booking"
          busy={busy}
          onConfirm={confirmCancel}
          onCancel={() => setAsking(null)}
        />
      )}
    </Card>
  );
}
