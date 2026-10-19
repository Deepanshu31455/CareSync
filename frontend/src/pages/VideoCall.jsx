import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, PhoneOff } from "lucide-react";

import { API_BASE } from "../config";
import useVideoCall from "../hooks/useVideoCall";
import usePatientInfo from "../hooks/usePatientInfo";
import { Card, ErrorState } from "../components/shared/ui";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import PatientPanel from "../components/doctorWorkspace/PatientPanel";
import CallStage from "../components/videoCall/CallStage";
import DoctorNotes from "../components/videoCall/DoctorNotes";

// The video call screen, for the visit's doctor and patient (route: /video-call/:visitId).
//   Doctor: the video, and beside it the patient's records and the notes form. Only the doctor can end the visit.
//   Patient: the video and a Leave button.
export default function VideoCall() {
  const { visitId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null); // { role, visit, other, notes }
  const [loadError, setLoadError] = useState(null);
  const [finished, setFinished] = useState(false); // this person ended or left the call
  const [tab, setTab] = useState("records");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // GET /video-calls/:visitId -> { role, visit, other, notes? }
        const res = await fetch(`${API_BASE}/video-calls/${visitId}`, { method: "GET", credentials: "include" });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Could not load the call.");
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Could not connect to the server.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  const isDoctor = data?.role === "doctor";
  const callOn = Boolean(data) && data.visit.status === "in_consultation" && !finished;
  const call = useVideoCall(visitId, callOn);
  const patient = usePatientInfo(null, isDoctor ? visitId : null, "video");

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }, [navigate]);

  const callEnded = finished || call.phase === "ended" || (data && data.visit.status !== "in_consultation");

  async function endCall() {
    try {
      setEnding(true);
      setEndError(null);
      // PUT /doctor/video/visits/:id/status { action: "complete" }
      const res = await fetch(`${API_BASE}/doctor/video/visits/${visitId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not end the call.");
      call.leave();
      setFinished(true);
      setConfirmEnd(false);
      setTab("notes");
    } catch (err) {
      setEndError(err.message || "Could not connect to the server.");
    } finally {
      setEnding(false);
    }
  }

  function leaveCall() {
    call.leave();
    setFinished(true);
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <ErrorState text={loadError} />
        <button onClick={goBack} className="mt-4 flex items-center gap-2 text-sm text-blue-700 hover:underline">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const person = { ...data.other, appointmentId: visitId, tokenNumber: data.visit.tokenNumber };

  // What replaces the video once the call is over or cannot continue
  const banner =
    call.phase === "replaced"
      ? "This call was opened in another tab or window. Use that one, or reload this page."
      : call.phase === "error"
      ? call.error
      : callEnded
      ? isDoctor
        ? "The call has ended. Add or update your notes."
        : "The call has ended. Thank you."
      : null;

  const stage = banner ? (
    <Card>
      <p className="py-8 text-center text-sm text-slate-600">{banner}</p>
      <div className="flex justify-center">
        <button onClick={goBack} className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </Card>
  ) : (
    <CallStage call={call} otherName={data.other.name}>
      {isDoctor ? (
        <button onClick={() => setConfirmEnd(true)} className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <PhoneOff size={16} /> End call
        </button>
      ) : (
        <button onClick={leaveCall} className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <PhoneOff size={16} /> Leave
        </button>
      )}
    </CallStage>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button onClick={goBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="font-serif text-lg font-semibold text-slate-900">
          Video visit · Token {data.visit.tokenNumber}
        </h1>
        <span className="w-12" />
      </div>

      {isDoctor ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>{stage}</div>

          <div className="space-y-3">
            <div className="flex gap-2">
              {[["records", "Patient records"], ["notes", "Notes"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  aria-pressed={tab === key}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === key ? "bg-slate-900 text-white" : "border border-slate-200 hover:bg-slate-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* both stay mounted, so typed notes are not lost when switching */}
            <div className={tab === "records" ? "" : "hidden"}>
              <PatientPanel person={person} state={patient} />
            </div>
            <div className={tab === "notes" ? "" : "hidden"}>
              <Card>
                <h2 className="mb-3 font-serif text-lg font-semibold text-slate-900">Notes for {data.other.name}</h2>
                <DoctorNotes visitId={visitId} initial={data.notes} />
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">{stage}</div>
      )}

      {confirmEnd && (
        <ConfirmDialog
          title="End this call?"
          message="The patient will be disconnected and the visit marked completed. You can still add notes afterwards."
          confirmText="End call"
          danger={false}
          busy={ending}
          error={endError}
          onConfirm={endCall}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </div>
  );
}
