import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { doctorLabel, formatDate, formatMoney } from "./helpers";
import { Card, EmptyState, StatusBadge, TabTitle, Thumb } from "./ui";
import PhotoLightbox from "../shared/PhotoLightbox";

// Small heading used inside an opened consultation
function Block({ title, children }) {
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </div>
  );
}

// The opened part of one consultation.
// Prescriptions, reports and bills that carry this consultation's id are shown here.
function ConsultationDetails({ consultation, prescriptions, reports, bills, onZoom }) {
  const id = consultation._id;
  const myPrescriptions = prescriptions.filter((p) => p.consultationId === id);
  const myReports = reports.filter((r) => r.consultationId === id);
  const myBills = bills.filter((b) => b.consultationId === id);

  const zoom = (src, downloadUrl, title) => onZoom({ src, downloadUrl: downloadUrl || src, title });

  return (
    <div className="space-y-5 border-t border-slate-100 px-4 py-4">
      <Block title="Diagnosis">
        <p className="text-sm text-slate-700">{consultation.diagnosis || "Not recorded"}</p>
      </Block>

      <Block title="Notes & medical history">
        <p className="whitespace-pre-line text-sm text-slate-700">{consultation.notes || "Not recorded"}</p>
      </Block>

      <Block title="Prescription">
        {myPrescriptions.length === 0 ? (
          <p className="text-sm text-slate-500">No prescription linked to this consultation.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {myPrescriptions.map((p) => (
              <Thumb key={p._id} src={p.fileUrl} alt="Prescription" onClick={() => zoom(p.fileUrl, p.downloadUrl, "Prescription")} />
            ))}
          </div>
        )}
      </Block>

      <Block title="Test reports">
        {myReports.length === 0 ? (
          <p className="text-sm text-slate-500">No test reports linked to this consultation.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {myReports.map((r) => (
              <div key={r._id} className="w-24">
                <Thumb src={r.fileUrl} alt={r.testName} onClick={() => zoom(r.fileUrl, r.downloadUrl, r.testName)} />
                <p className="mt-1 truncate text-xs text-slate-600" title={r.testName}>{r.testName}</p>
              </div>
            ))}
          </div>
        )}
      </Block>

      <Block title="Bill">
        {myBills.length === 0 ? (
          <p className="text-sm text-slate-500">No bill linked to this consultation.</p>
        ) : (
          myBills.map((b) => (
            <div key={b._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-700">
                <p className="font-semibold">{formatMoney(b.amount)}</p>
                <p className="text-xs text-slate-500">
                  Invoice {b.invoiceNumber} · Payment date: {formatDate(b.date)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                {b.fileUrl && (
                  <a
                    href={b.downloadUrl || b.fileUrl}
                    download
                    className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Download size={14} /> Download Invoice
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </Block>
    </div>
  );
}

// Previous consultations, newest first. Read-only: the patient can only view them.
export default function ConsultationsTab({ consultations, prescriptions, reports, bills }) {
  const [openId, setOpenId] = useState(null); // which consultation is expanded
  const [zoomed, setZoomed] = useState(null); // image shown in the larger view

  const sorted = [...consultations].sort(
    (a, b) => new Date(b.consultationDate) - new Date(a.consultationDate)
  );

  return (
    <Card>
      <TabTitle hint="Newest first. Tap a consultation to see its medical history, prescription, reports and bill.">
        Previous Consultations
      </TabTitle>

      {sorted.length === 0 ? (
        <EmptyState text="No consultations yet. Your visit history will appear here after your first consultation." />
      ) : (
        <ul className="space-y-3">
          {sorted.map((c) => {
            const isOpen = openId === c._id;

            return (
              <li key={c._id} className="rounded-xl border border-slate-200">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : c._id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{doctorLabel(c.doctor)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {c.doctor?.specialization || "—"}
                      {c.reference && ` · Ref ${c.reference}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-slate-600">{formatDate(c.consultationDate)}</span>
                    <ChevronDown size={18} className={`text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <ConsultationDetails
                    consultation={c}
                    prescriptions={prescriptions}
                    reports={reports}
                    bills={bills}
                    onZoom={setZoomed}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {zoomed && <PhotoLightbox image={zoomed} onClose={() => setZoomed(null)} />}
    </Card>
  );
}
