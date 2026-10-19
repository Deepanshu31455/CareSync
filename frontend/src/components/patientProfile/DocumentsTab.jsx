import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { KINDS } from "./constants";
import { canDelete, formatDate, newestFirst } from "./helpers";
import { Card, EmptyState, TabTitle, Thumb } from "./ui";
import PhotoLightbox from "../shared/PhotoLightbox";
import UploadForm from "./UploadForm";

// What each kind shows on its card: a title and some detail lines
const CARD = {
  prescriptions: (item) => ({
    name: "Prescription",
    lines: [item.doctorName, item.reference && `Ref ${item.reference}`],
  }),
  reports: (item) => ({
    name: item.testName,
    lines: [item.provider],
  }),
};

// One tab for both Prescriptions and Test Reports: upload, view larger, download, delete.
//   kind     = "prescriptions" | "reports"
//   items    = the list from Redux
//   onUpload = (values, file) => Promise<boolean>
//   onDelete = (id) => Promise
export default function DocumentsTab({ kind, items, saving, onUpload, onDelete }) {
  const [zoomed, setZoomed] = useState(null);
  const config = KINDS[kind];

  async function remove(item, name) {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      await onDelete(item._id);
    }
  }

  return (
    <Card>
      <TabTitle hint={config.hint}>{config.title}</TabTitle>

      <UploadForm kind={kind} saving={saving} onUpload={onUpload} />

      {items.length === 0 ? (
        <EmptyState text={config.empty} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {newestFirst(items).map((item) => {
            const { name, lines } = CARD[kind](item);

            return (
              <article key={item._id} className="flex gap-4 rounded-xl border border-slate-200 p-3">
                <Thumb
                  src={item.fileUrl}
                  alt={name}
                  className="h-28 w-24"
                  onClick={() => setZoomed({ src: item.fileUrl, downloadUrl: item.downloadUrl || item.fileUrl, title: name })}
                />

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <h3 className="truncate font-semibold text-slate-900" title={name}>{name}</h3>
                    <p className="text-xs text-slate-500">{formatDate(item.date)}</p>

                    {lines.filter(Boolean).map((line) => (
                      <p key={line} className="mt-0.5 truncate text-xs text-slate-600" title={line}>{line}</p>
                    ))}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.uploadedBy === "hospital" ? "Added by hospital" : "Uploaded by you"}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-4">
                    <a
                      href={item.downloadUrl || item.fileUrl}
                      download
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <Download size={14} /> Download
                    </a>

                    {canDelete(item) && (
                      <button
                        type="button"
                        onClick={() => remove(item, name)}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {zoomed && <PhotoLightbox image={zoomed} onClose={() => setZoomed(null)} />}
    </Card>
  );
}
