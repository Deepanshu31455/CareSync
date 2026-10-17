import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import useDeskDoctors from "../hooks/useDeskDoctors";
import useQueue from "../hooks/useQueue";
import useQueueDesk from "../hooks/useQueueDesk";
import useUpcoming from "../hooks/useUpcoming";
import { todayIST, formatDay } from "../utils/dates";

import { EmptyState, ErrorState, Messages } from "../components/shared/ui";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { inputClass } from "../components/shared/constants";
import DoctorPicker from "../components/queueDesk/DoctorPicker";
import NowServingCard from "../components/queueDesk/NowServingCard";
import WalkInForm from "../components/queueDesk/WalkInForm";
import QueueRow from "../components/queueDesk/QueueRow";
import RescheduleDialog from "../components/queueDesk/RescheduleDialog";
import UpcomingDays from "../components/queueDesk/UpcomingDays";
import RecordsDialog from "../components/records/RecordsDialog";
import { FINISHED } from "../components/queueDesk/constants";

// The receptionist's working screen: pick a doctor, see that doctor's queue live,
// add walk-in patients, call the next patient, complete, cancel or reschedule.
// The doctor is always addressed by the 6-digit ID (kept in the address as ?doctor=355555).
export default function ReceptionistDashboard() {
  /* ---------- 1. Which doctor, which day ---------- */

  const { doctors, loading: doctorsLoading, error: doctorsError, reload } = useDeskDoctors();
  const [params, setParams] = useSearchParams();

  const doctor = doctors.find((d) => d.id === params.get("doctor")) || doctors[0];
  const doctorId = doctor?.id;

  // "Today" is checked every minute, so a screen left open overnight moves on to the new day
  const [today, setToday] = useState(todayIST());
  useEffect(() => {
    const timer = setInterval(() => setToday(todayIST()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const [pickedDate, setPickedDate] = useState(null); // null = follow today
  const date = pickedDate && pickedDate >= today ? pickedDate : today;
  const isToday = date === today;

  /* ---------- 2. The live queue and the actions ---------- */

  const queue = useQueue({ doctorId, date, mode: "queue" });
  const desk = useQueueDesk({ doctorId, refresh: queue.refresh, connection: queue.connection });

  const upcoming = useUpcoming(doctorId);

  const [confirm, setConfirm] = useState(null); // { item, action }
  const [rescheduling, setRescheduling] = useState(null); // item
  const [recordsFor, setRecordsFor] = useState(null); // item whose records are open

  const active = queue.items.filter((item) => !FINISHED.includes(item.status));
  const finished = queue.items.filter((item) => FINISHED.includes(item.status));

  async function runConfirmed() {
    const done =
      confirm.action === "fee_undo"
        ? await desk.setFee(confirm.item.appointmentId, false)
        : await desk.changeStatus(confirm.item.appointmentId, confirm.action);
    if (done) setConfirm(null);
  }

  // Marking a fee paid needs one click. Undoing it asks first, so a wrong click cannot unmark it silently.
  function askFee(item) {
    if (item.paymentStatus === "paid") setConfirm({ item, action: "fee_undo" });
    else desk.setFee(item.appointmentId, true);
  }

  async function runReschedule(newDate) {
    const done = await desk.reschedule(rescheduling.appointmentId, newDate);
    if (done) setRescheduling(null);
  }

  /* ---------- 3. Loading and empty states ---------- */

  if (doctorsLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-600">Loading your doctors...</p>
      </div>
    );
  }
  if (doctorsError) return <ErrorState text={doctorsError} onRetry={reload} />;

  if (!doctor) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState text="You are not connected to any doctor yet. Send a request to a doctor from your profile; once they accept, their queue appears here." />
        <p className="mt-4 text-center">
          <Link to="/profile" className="text-sm font-semibold text-blue-600 hover:underline">
            Go to my profile
          </Link>
        </p>
      </div>
    );
  }

  const confirmText = {
    complete: { title: "Complete this visit?", button: "Complete", danger: false },
    cancel: { title: "Cancel this token?", button: "Cancel token", danger: true },
    no_show: { title: "Mark as no-show?", button: "Mark no-show", danger: true },
    fee_undo: { title: "Mark the fee as not paid?", button: "Mark not paid", danger: true },
  };

  /* ---------- 4. The screen ---------- */

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-slate-900">Queue desk</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDay(date)}
            {isToday ? " · Today" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-slate-400" />
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setPickedDate(e.target.value || null)}
            className={`${inputClass} w-auto`}
            aria-label="Day"
          />
          {!isToday && (
            <button
              onClick={() => setPickedDate(null)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Today
            </button>
          )}
        </div>
      </div>

      <DoctorPicker doctors={doctors} selectedId={doctorId} onSelect={(id) => setParams({ doctor: id }, { replace: true })} />

      <UpcomingDays
        days={upcoming.days}
        selected={date}
        onPick={(picked) => setPickedDate(picked)}
      />

      <Messages success={desk.message} error={desk.error} />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* The queue */}
        <div className="order-2 space-y-5 lg:order-1">
          {queue.error ? (
            <ErrorState text={queue.error} onRetry={queue.refresh} />
          ) : queue.loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <>
              {active.length === 0 ? (
                <EmptyState
                  text={
                    queue.items.length === 0
                      ? "No one is in the queue for this day yet."
                      : "Everyone in the queue has been seen."
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {active.map((item) => (
                    <QueueRow
                      key={item.appointmentId}
                      item={item}
                      isToday={isToday}
                      working={desk.working}
                      onComplete={(row) => setConfirm({ item: row, action: "complete" })}
                      onCancel={(row) => setConfirm({ item: row, action: "cancel" })}
                      onNoShow={(row) => setConfirm({ item: row, action: "no_show" })}
                      onReschedule={setRescheduling}
                      onRecords={setRecordsFor}
                      onFee={askFee}
                    />
                  ))}
                </ul>
              )}

              {finished.length > 0 && (
                <details className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                    Finished ({finished.length})
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {finished.map((item) => (
                      <QueueRow key={item.appointmentId} item={item} isToday={isToday} working={null} onRecords={setRecordsFor} onFee={askFee} />
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>

        {/* Now serving + add walk-in */}
        <div className="order-1 space-y-5 lg:order-2">
          <NowServingCard
            nowServing={queue.nowServing}
            waiting={queue.waiting}
            connection={queue.connection}
            canCall={isToday}
            working={desk.working}
            onCallNext={desk.callNext}
          />
          <WalkInForm disabled={!isToday} working={desk.working} onSubmit={desk.addWalkIn} />
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirmText[confirm.action].title}
          message={`Token ${confirm.item.tokenNumber} · ${confirm.item.name}`}
          confirmText={confirmText[confirm.action].button}
          danger={confirmText[confirm.action].danger}
          busy={desk.working !== null}
          error={desk.error}
          onConfirm={runConfirmed}
          onCancel={() => setConfirm(null)}
        />
      )}

      {recordsFor && <RecordsDialog doctorId={doctorId} item={recordsFor} onClose={() => setRecordsFor(null)} />}

      {rescheduling && (
        <RescheduleDialog
          item={rescheduling}
          busy={desk.working !== null}
          error={desk.error}
          onConfirm={runReschedule}
          onCancel={() => setRescheduling(null)}
        />
      )}
    </div>
  );
}
