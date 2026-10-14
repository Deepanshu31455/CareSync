import { useEffect, useState } from "react";
import { ExternalLink, Trash2, X } from "lucide-react";

import useVisitRecords from "../../hooks/useVisitRecords";
import { Field, Messages } from "../shared/ui";
import ConfirmDialog from "../shared/ConfirmDialog";
import { inputClass } from "../shared/constants";
import { todayIST } from "../../utils/dates";
import { KINDS, KIND_ORDER, MAX_FILE_MB } from "./constants";

const emptyForm = () => ({ date: todayIST(), status: "paid" });

// Tests, reports and bills of one visit. They are saved in the patient's own record
// (under the visit in Previous Consultations), so the patient and the doctor see them.
//   doctorId  the doctor's 6-digit ID      item  the queue row (name and token are shown)
export default function RecordsDialog({ doctorId, item, onClose }) {
  const { records, loading, working, error, message, upload, remove } = useVisitRecords(doctorId, item.appointmentId);

  const [kind, setKind] = useState("reports");
  const [form, setForm] = useState(emptyForm());
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0); // changing it clears the file input
  const [localError, setLocalError] = useState(null);
  const [removing, setRemoving] = useState(null); // saved item to remove

  const config = KINDS[kind];

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !working && !removing && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [working, removing, onClose]);

  function pickKind(next) {
    setKind(next);
    setForm(emptyForm());
    setFile(null);
    setFileKey((k) => k + 1);
    setLocalError(null);
  }

  function pickFile(e) {
    const chosen = e.target.files?.[0] || null;
    setLocalError(null);
    if (chosen && chosen.size > MAX_FILE_MB * 1024 * 1024) {
      setLocalError(`The file is larger than ${MAX_FILE_MB} MB.`);
      setFile(null);
      setFileKey((k) => k + 1);
      return;
    }
    setFile(chosen);
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return setLocalError("Choose a file first.");
    const missing = config.fields.find((f) => f.required && !String(form[f.name] ?? "").trim());
    if (missing) return setLocalError(`${missing.label} is required.`);

    setLocalError(null);
    const done = await upload(kind, form, file);
    if (done) {
      setForm(emptyForm());
      setFile(null);
      setFileKey((k) => k + 1);
    }
  }

  async function runRemove() {
    const done = await remove(removing.kind, removing.id);
    if (done) setRemoving(null);
  }

  const saved = records[kind];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !working && onClose()} role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h3 className="font-serif text-lg font-semibold text-slate-900">Records · {item.name}</h3>
            <p className="mt-0.5 text-sm text-slate-500">Token {item.tokenNumber} · saved in the patient's own record</p>
          </div>
          <button onClick={onClose} disabled={working} className="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="flex gap-2">
            {KIND_ORDER.map((k) => (
              <button
                key={k}
                onClick={() => pickKind(k)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  kind === k ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {KINDS[k].label} ({records[k].length})
              </button>
            ))}
          </div>

          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : saved.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No {config.label.toLowerCase()} added for this visit yet.</p>
            ) : (
              <ul className="space-y-2">
                {saved.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{config.title(it)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {config.subtitle(it)}
                        {it.uploadedBy === "patient" ? " · added by the patient" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {it.fileUrl && (
                        <a href={it.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <ExternalLink size={14} /> Open
                        </a>
                      )}
                      {it.uploadedBy !== "patient" && (
                        <button onClick={() => setRemoving(it)} disabled={working} className="rounded-full p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label="Remove">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-700">Add {config.one}</p>

            <Field label={`File (${config.fileHint})`}>
              <input key={fileKey} type="file" accept={config.accept} onChange={pickFile} className={inputClass} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              {config.fields.map((f) => (
                <Field key={f.name} label={f.required ? f.label : `${f.label} (optional)`}>
                  {f.type === "select" ? (
                    <select value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} className={inputClass}>
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || "text"}
                      min={f.type === "number" ? 0 : undefined}
                      value={form[f.name] || ""}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
              ))}
            </div>

            <Messages success={message} error={localError || error} />

            <div className="flex justify-end">
              <button type="submit" disabled={working} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {working ? "Please wait..." : `Add ${config.one}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {removing && (
        <ConfirmDialog
          title={`Remove this ${KINDS[removing.kind].one}?`}
          message={KINDS[removing.kind].title(removing)}
          confirmText="Remove"
          busy={working}
          error={error}
          onConfirm={runRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
