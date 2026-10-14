import { useEffect, useState } from "react";

import useDoctorSelf from "../hooks/useDoctorSelf";
import useQueue from "../hooks/useQueue";
import usePatientInfo from "../hooks/usePatientInfo";
import { todayIST, formatDay } from "../utils/dates";

import { ErrorState } from "../components/shared/ui";
import WorkspaceTabs from "../components/doctorWorkspace/WorkspaceTabs";
import DoctorQueue from "../components/doctorWorkspace/DoctorQueue";
import PatientPanel from "../components/doctorWorkspace/PatientPanel";
import NowServingCard from "../components/queueDesk/NowServingCard";

// The doctor's workspace for patients who come to the clinic.
// Left: today's live queue (the receptionist runs it, the doctor only watches).
// Right: the information of the person the doctor opened.
export default function DoctorPhysical() {
  const { doctor, loading: doctorLoading, error: doctorError, reload } = useDoctorSelf();
  const doctorId = doctor?.id; // the doctor's 6-digit ID

  // The day follows the clock, so a screen left open overnight moves on
  const [today, setToday] = useState(todayIST());
  useEffect(() => {
    const timer = setInterval(() => setToday(todayIST()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const queue = useQueue({ doctorId, date: today, mode: "queue" });

  // Which person is open: the one the doctor chose, otherwise whoever is with the doctor now
  const [chosenId, setChosenId] = useState(null);
  const inside = queue.items.find((item) => item.status === "in_consultation");
  const chosen = queue.items.find((item) => item.appointmentId === chosenId);
  const person = chosen || inside || null;

  const patient = usePatientInfo(doctorId, person?.appointmentId);

  if (doctorLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }
  if (doctorError || !doctor) return <ErrorState text={doctorError || "Could not load your profile."} onRetry={reload} />;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-slate-900">Dr. {doctor.fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">Today · {formatDay(today)} · ID {doctor.id}</p>
        </div>
        <WorkspaceTabs />
      </div>

      {queue.error ? (
        <ErrorState text={queue.error} onRetry={queue.refresh} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-5">
            <NowServingCard nowServing={queue.nowServing} waiting={queue.waiting} connection={queue.connection} canCall={false} readOnly />

            {queue.loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <DoctorQueue items={queue.items} selectedId={person?.appointmentId} onSelect={setChosenId} />
            )}
          </div>

          <PatientPanel person={person} state={patient} />
        </div>
      )}
    </div>
  );
}
