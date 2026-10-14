import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, FileText, UserRound } from "lucide-react";

import { Card, EmptyState, ErrorState } from "../shared/ui";
import { formatDate } from "../shared/helpers";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "consultations", label: "Consultations" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "reports", label: "Test reports" },
];

const GENDER_LABEL = { male: "Male", female: "Female", other: "Other", "prefer-not-to-say": "Not stated" };

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || "Not provided"}</p>
    </div>
  );
}

// A stored document: title, date and a link that opens it in a new tab
function FileRow({ title, subtitle, date, url }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <FileText size={18} className="shrink-0 text-slate-400" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">
            {[subtitle, formatDate(date)].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
          Open <ExternalLink size={13} />
        </a>
      )}
    </li>
  );
}

// What the doctor sees about the person they opened in the queue.
//   person  the queue row (name, age, gender, source...)       state  { info, loading, error } from usePatientInfo
export default function PatientPanel({ person, state }) {
  const [tab, setTab] = useState("overview");

  // a new person always starts on the overview
  useEffect(() => {
    setTab("overview");
  }, [person?.appointmentId]);

  if (!person) {
    return (
      <Card>
        <EmptyState text="Choose a patient from the queue to see their information." />
      </Card>
    );
  }

  const { info, loading, error } = state;

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <UserRound size={22} />
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-slate-900">
            {person.name} <span className="text-base font-normal text-slate-400">· token {person.tokenNumber}</span>
          </h2>
          <p className="text-sm text-slate-500">
            {[person.age != null ? `${person.age} yrs` : null, GENDER_LABEL[person.gender]].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && <ErrorState text={error} />}

      {/* A walk-in has no account: nothing is kept about them */}
      {info?.walkIn && (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          Walk-in patient: no records are kept for people who do not use the app.
        </p>
      )}

      {info && !info.walkIn && (
        <>
          <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={`rounded-full px-4 py-1.5 text-sm ${
                  tab === t.key ? "bg-slate-900 font-semibold text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
                {t.key !== "overview" && ` (${info[t.key].length})`}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === "overview" && (
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 ${info.patient.allergiesAndConditions ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {info.patient.allergiesAndConditions && <AlertTriangle size={14} className="text-amber-600" />}
                    Allergies and existing conditions
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-800">
                    {info.patient.allergiesAndConditions || "None reported"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Written by the patient in their profile.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Detail label="Age" value={info.patient.age != null ? `${info.patient.age} yrs` : ""} />
                  <Detail label="Gender" value={GENDER_LABEL[info.patient.gender]} />
                  <Detail label="Blood group" value={info.patient.bloodGroup} />
                </div>
              </div>
            )}

            {tab === "consultations" &&
              (info.consultations.length === 0 ? (
                <EmptyState text="No previous consultations." />
              ) : (
                <ul className="space-y-3">
                  {info.consultations.map((c) => (
                    <li key={c.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(c.date)}
                        {c.doctorName ? ` · Dr. ${c.doctorName}` : ""}
                        {c.specialization ? ` (${c.specialization})` : ""}
                      </p>
                      {c.diagnosis && <p className="mt-1 text-sm text-slate-700">Diagnosis: {c.diagnosis}</p>}
                      {c.notes && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{c.notes}</p>}
                    </li>
                  ))}
                </ul>
              ))}

            {tab === "prescriptions" &&
              (info.prescriptions.length === 0 ? (
                <EmptyState text="No prescriptions." />
              ) : (
                <ul className="space-y-2">
                  {info.prescriptions.map((p) => (
                    <FileRow key={p.id} title="Prescription" subtitle={p.doctorName ? `Dr. ${p.doctorName}` : ""} date={p.date} url={p.fileUrl} />
                  ))}
                </ul>
              ))}

            {tab === "reports" &&
              (info.reports.length === 0 ? (
                <EmptyState text="No test reports." />
              ) : (
                <ul className="space-y-2">
                  {info.reports.map((r) => (
                    <FileRow key={r.id} title={r.testName} subtitle={r.provider} date={r.date} url={r.fileUrl} />
                  ))}
                </ul>
              ))}
          </div>
        </>
      )}
    </Card>
  );
}
