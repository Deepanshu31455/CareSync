import { useEffect, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { API_BASE } from "../../config";
import { Messages } from "../shared/ui";
import { inputClass } from "../shared/constants";

// The doctor's notes for one video visit: a diagnosis and free notes.
// They are saved into the patient's "Previous Consultations" for this visit and can be changed
// during the call and for 48 hours after it.
//   visitId   the video visit
//   initial   { diagnosis, notes } already saved (from the server)
export default function DoctorNotes({ visitId, initial }) {
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const saved = useRef({ diagnosis: initial?.diagnosis || "", notes: initial?.notes || "" });

  // Fill the form once when the saved notes arrive; never overwrite what the doctor is typing
  const filled = useRef(false);
  useEffect(() => {
    if (!initial || filled.current) return;
    filled.current = true;
    setDiagnosis(initial.diagnosis || "");
    setNotes(initial.notes || "");
    saved.current = { diagnosis: initial.diagnosis || "", notes: initial.notes || "" };
  }, [initial]);

  const changed = diagnosis !== saved.current.diagnosis || notes !== saved.current.notes;

  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, error]);

  // A closed tab with unsaved notes asks first
  useEffect(() => {
    if (!changed) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed]);

  async function save() {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      // PUT /doctor/video/visits/:id/notes { diagnosis, notes }
      const res = await fetch(`${API_BASE}/doctor/video/visits/${visitId}/notes`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis, notes }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Could not save the notes.");

      saved.current = { diagnosis: diagnosis.trim(), notes: notes.trim() };
      setDiagnosis(diagnosis.trim());
      setNotes(notes.trim());
      setMessage(result.message || "Notes saved.");
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="diagnosis" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Diagnosis
        </label>
        <input
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          maxLength={300}
          placeholder="For example: Viral fever"
          className={`${inputClass} mt-1`}
        />
      </div>
      <div>
        <label htmlFor="visit-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notes
        </label>
        <textarea
          id="visit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={3000}
          rows={8}
          placeholder="What was discussed, advice, follow-up..."
          className={`${inputClass} mt-1 resize-y`}
        />
        <p className="mt-1 text-right text-xs text-slate-400">{notes.length}/3000</p>
      </div>

      <Messages success={message} error={error} />

      <button
        onClick={save}
        disabled={saving || !changed}
        className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? "Saving..." : "Save notes"}
      </button>
      <p className="text-xs text-slate-500">Saved in the patient's Previous Consultations for this visit.</p>
    </div>
  );
}
