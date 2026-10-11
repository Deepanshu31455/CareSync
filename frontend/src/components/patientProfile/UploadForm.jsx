import { useState } from "react";
import { Plus, X } from "lucide-react";
import { KINDS, inputClass } from "./constants";
import { checkFile } from "./helpers";
import { Field } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);

// Upload form for a prescription, test report or bill.
// It is built from KINDS[kind].fields in constants.js, so there is one form for all three.
//   kind     = "prescriptions" | "reports" | "bills"
//   saving   = true while any save/upload is running
//   onUpload = (values, file) => Promise<boolean>   true when the upload worked
export default function UploadForm({ kind, saving, onUpload }) {
  const config = KINDS[kind];

  // Starting values: today's date, the first option of a dropdown, otherwise empty
  const emptyValues = () =>
    Object.fromEntries(
      config.fields.map((f) => [f.name, f.type === "date" ? today() : f.options?.[0] ?? ""])
    );

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyValues);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0); // changing this clears the file input
  const [problem, setProblem] = useState(null);

  function chooseFile(event) {
    const picked = event.target.files?.[0] || null;

    if (picked) {
      const message = checkFile(picked, config);
      if (message) {
        setProblem(message);
        setFile(null);
        event.target.value = "";
        return;
      }
    }
    setProblem(null);
    setFile(picked);
  }

  async function submit(event) {
    event.preventDefault();

    if (!file) {
      setProblem(`Please choose a file (${config.acceptText}).`);
      return;
    }

    const worked = await onUpload(values, file);
    if (worked) {
      setValues(emptyValues());
      setFile(null);
      setFileKey((k) => k + 1);
      setProblem(null);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-5 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Plus size={16} /> Upload {config.label.toLowerCase()}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mb-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {config.fields.map((f) => (
          <Field key={f.name} label={f.label}>
            {f.type === "select" ? (
              <select
                className={inputClass}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              >
                {f.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                className={inputClass}
                type={f.type}
                min={f.type === "number" ? 0 : undefined}
                step={f.type === "number" ? "0.01" : undefined}
                required={f.required}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            )}
          </Field>
        ))}

        <Field label={`File (${config.acceptText}, max 5 MB)`}>
          <input
            key={fileKey}
            type="file"
            accept={config.accept.join(",")}
            onChange={chooseFile}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </Field>
      </div>

      {problem && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{problem}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Uploading..." : "Upload"}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setProblem(null);
          }}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <X size={16} /> Cancel
        </button>
      </div>
    </form>
  );
}
