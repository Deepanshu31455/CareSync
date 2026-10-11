import { Download, ExternalLink, Trash2 } from "lucide-react";
import { KINDS } from "./constants";
import { canDelete, formatDate, formatMoney, newestFirst } from "./helpers";
import { Card, EmptyState, StatusBadge, TabTitle } from "./ui";
import UploadForm from "./UploadForm";

// Bills & Payments: upload, open, download invoice, delete. Latest first.
//   bills    = the list from Redux
//   onUpload = (values, file) => Promise<boolean>
//   onDelete = (id) => Promise
export default function BillsTab({ bills, saving, onUpload, onDelete }) {
  const config = KINDS.bills;

  async function remove(bill) {
    if (window.confirm(`Delete invoice ${bill.invoiceNumber}? This cannot be undone.`)) {
      await onDelete(bill._id);
    }
  }

  return (
    <Card>
      <TabTitle hint={config.hint}>{config.title}</TabTitle>

      <UploadForm kind="bills" saving={saving} onUpload={onUpload} />

      {bills.length === 0 ? (
        <EmptyState text={config.empty} />
      ) : (
        <ul className="space-y-3">
          {newestFirst(bills).map((bill) => (
            <li
              key={bill._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">Invoice {bill.invoiceNumber}</p>
                <p className="text-xs text-slate-500">
                  {bill.doctorName ? `${bill.doctorName} · ` : ""}
                  Payment date: {formatDate(bill.date)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {bill.uploadedBy === "hospital" ? "Added by hospital" : "Uploaded by you"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold text-slate-900">{formatMoney(bill.amount)}</span>
                <StatusBadge status={bill.status} />

                {bill.fileUrl ? (
                  <>
                    <a
                      href={bill.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink size={14} /> Open
                    </a>
                    <a
                      href={bill.downloadUrl || bill.fileUrl}
                      download
                      className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Download size={14} /> Download Invoice
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">Invoice file not available yet</span>
                )}

                {canDelete(bill) && (
                  <button
                    type="button"
                    onClick={() => remove(bill)}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
