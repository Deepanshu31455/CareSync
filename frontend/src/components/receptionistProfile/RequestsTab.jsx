import { Clock } from "lucide-react";
import { formatDate } from "../shared/helpers";
import { Card, EmptyState, TabTitle } from "../shared/ui";
import DoctorRow from "./DoctorRow";

// Requests the receptionist sent that the doctor has not answered yet.
//   requests = [{ assignmentId, requestedAt, expiresAt, expired, doctor }]
//   onCancel = (assignmentId) => Promise<boolean>
export default function RequestsTab({ requests, saving, onCancel }) {
  return (
    <Card>
      <TabTitle hint="Waiting for the doctor to accept from the email we sent. Nothing is connected until they do.">
        Pending Requests ({requests.length})
      </TabTitle>

      {requests.length === 0 ? (
        <EmptyState text="No pending requests." />
      ) : (
        <ul className="space-y-3">
          {requests.map((row) => (
            <DoctorRow
              key={row.assignmentId}
              doctor={row.doctor}
              note={
                row.expired
                  ? `Sent ${formatDate(row.requestedAt)} · link expired`
                  : `Sent ${formatDate(row.requestedAt)} · valid until ${formatDate(row.expiresAt)}`
              }
            >
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  row.expired ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"
                }`}
              >
                <Clock size={12} /> {row.expired ? "Expired" : "Waiting"}
              </span>

              <button
                onClick={() => onCancel(row.assignmentId)}
                disabled={saving}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </DoctorRow>
          ))}
        </ul>
      )}
    </Card>
  );
}
