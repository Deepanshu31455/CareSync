import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock } from "lucide-react";

import useVideoQueue from "../hooks/useVideoQueue";
import usePatientInfo from "../hooks/usePatientInfo";
import { todayIST, formatDay } from "../utils/dates";

import { EmptyState, ErrorState, Messages } from "../components/shared/ui";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { inputClass } from "../components/shared/constants";
import DoctorNavbar from "../components/doctorWorkspace/DoctorNavbar";
import WorkspaceTabs from "../components/doctorWorkspace/WorkspaceTabs";
import PatientPanel from "../components/doctorWorkspace/PatientPanel";
import UpcomingDays from "../components/queueDesk/UpcomingDays";
import { CONNECTION } from "../components/queueDesk/constants";
import VideoRow from "../components/videoDesk/VideoRow";
import TimeDialog from "../components/videoDesk/TimeDialog";
import ScheduleDialog from "../components/videoDesk/ScheduleDialog";
import { VIDEO_FINISHED } from "../components/videoDesk/constants";

// The doctor's workspace for video consultations. Only the doctor controls it:
// give each patient a time, see who is available, start a call, end it.
export default function DoctorVideo() {
  const navigate = useNavigate();
  // "Today" is checked every minute, so a screen left open overnight moves on to the new day
  const [today, setToday] = useState(todayIST());
  useEffect(() => {
    const timer = setInterval(() => setToday(todayIST()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const [pickedDate, setPickedDate] = useState(null); // null = follow today
  const date = pickedDate && pickedDate >= today ? pickedDate : today;
  const isToday = date === today;

  const queue = useVideoQueue(date);

  const [chosenId, setChosenId] = useState(null); // the patient whose information is open
  const [confirm, setConfirm] = useState(null); // { item, action }
  const [timing, setTiming] = useState(null); // the patient whose time is being set
  const [scheduling, setScheduling] = useState(false);

  const active = queue.items.filter((item) => !VIDEO_FINISHED.includes(item.status));
  const finished = queue.items.filter((item) => VIDEO_FINISHED.includes(item.status));
  const waiting = queue.items.filter((item) => item.status === "waiting");
  const availableCount = waiting.filter((item) => item.ready).length;

  // The information panel works with the same names as the clinic queue
  const person = queue.items
    .filter((item) => item.visitId === chosenId && item.status !== "cancelled" && item.status !== "no_show")
    .map((item) => ({ ...item, appointmentId: item.visitId }))[0] || null;
  const patient = usePatientInfo(null, person?.visitId, "video");

  async function runConfirmed() {
    const done = await queue.changeStatus(confirm.item.visitId, confirm.action);
    if (done) setConfirm(null);
  }

  async function saveTime(time) {
    const done = await queue.setTime(timing.visitId, time);
    if (done) setTiming(null);
  }

  async function clearTime() {
    const done = await queue.setTime(timing.visitId, null);
    if (done) setTiming(null);
  }

  async function giveTimes(form) {
    const done = await queue.scheduleAll(form);
    if (done) setScheduling(false);
  }

  // Starting a call opens the call screen
  async function startCall(item) {
    const done = await queue.changeStatus(item.visitId, "start");
    if (done) navigate(`/video-call/${item.visitId}`); // the call screen has the records and notes beside the video
  }

  const confirmText = {
    complete: { title: "End this call?", button: "End call", danger: false },
    cancel: { title: "Cancel this video visit?", button: "Cancel visit", danger: true },
    no_show: { title: "Mark as no-show?", button: "Mark no-show", danger: true },
  };
  const status = CONNECTION[queue.connection] || CONNECTION.connecting;

  return (
    <>
      <DoctorNavbar />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-slate-900">Video visits</h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatDay(date)}
              {isToday ? " · Today" : ""}
            </p>
          </div>
          <WorkspaceTabs />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-slate-400" />
            <input type="date" value={date} min={today} onChange={(e) => setPickedDate(e.target.value || null)} className={`${inputClass} w-auto`} aria-label="Day" />
            {!isToday && (
              <button onClick={() => setPickedDate(null)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => setScheduling(true)}
            disabled={waiting.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Clock size={15} /> Give times to everyone
          </button>

          <span className={`ml-auto flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${status.className}`}>
            <span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.label}
          </span>
        </div>

        <UpcomingDays days={queue.upcoming} selected={date} onPick={(picked) => setPickedDate(picked)} />

        {queue.items.length > 0 && (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{waiting.length}</span> waiting ·{" "}
            <span className="font-semibold text-green-700">{availableCount}</span> available now ·{" "}
            <span className="font-semibold text-slate-900">{queue.items.filter((i) => i.status === "completed").length}</span> done
          </p>
        )}

        <Messages success={queue.message} error={queue.actionError} />

        {queue.error ? (
          <ErrorState text={queue.error} onRetry={queue.reload} />
        ) : queue.loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              {active.length === 0 ? (
                <EmptyState text={queue.items.length === 0 ? "No video visits for this day yet." : "Everyone in this day's video queue has been seen."} />
              ) : (
                <ul className="space-y-3">
                  {active.map((item) => (
                    <VideoRow
                      key={item.visitId}
                      item={item}
                      isToday={isToday}
                      selected={chosenId === item.visitId}
                      working={queue.working}
                      onSelect={(row) => setChosenId(row.visitId)}
                      onSetTime={setTiming}
                      onStart={startCall}
                      onComplete={(row) => setConfirm({ item: row, action: "complete" })}
                      onOpenCall={(row) => navigate(`/video-call/${row.visitId}`)}
                      onCancel={(row) => setConfirm({ item: row, action: "cancel" })}
                      onNoShow={(row) => setConfirm({ item: row, action: "no_show" })}
                    />
                  ))}
                </ul>
              )}

              {finished.length > 0 && (
                <details className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Finished ({finished.length})</summary>
                  <ul className="mt-3 space-y-3">
                    {finished.map((item) => (
                      <VideoRow
                        key={item.visitId}
                        item={item}
                        isToday={isToday}
                        selected={chosenId === item.visitId}
                        working={null}
                        onSelect={(row) => setChosenId(row.visitId)}
                      />
                    ))}
                  </ul>
                </details>
              )}
            </div>

            <PatientPanel person={person} state={patient} />
          </div>
        )}

        {confirm && (
          <ConfirmDialog
            title={confirmText[confirm.action].title}
            message={`Token ${confirm.item.tokenNumber} · ${confirm.item.name}`}
            confirmText={confirmText[confirm.action].button}
            danger={confirmText[confirm.action].danger}
            busy={queue.working !== null}
            error={queue.actionError}
            onConfirm={runConfirmed}
            onCancel={() => setConfirm(null)}
          />
        )}

        {timing && (
          <TimeDialog
            item={timing}
            isToday={isToday}
            busy={queue.working !== null}
            error={queue.actionError}
            onSave={saveTime}
            onClear={clearTime}
            onCancel={() => setTiming(null)}
          />
        )}

        {scheduling && (
          <ScheduleDialog
            date={date}
            waiting={waiting}
            busy={queue.working !== null}
            error={queue.actionError}
            onSubmit={giveTimes}
            onCancel={() => setScheduling(false)}
          />
        )}
      </div>
    </>
  );
}
