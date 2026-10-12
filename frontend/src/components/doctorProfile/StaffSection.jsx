import { useState } from "react";
import { Check, Clock, UserMinus, Users, X } from "lucide-react";

import useDoctorStaff from "../../hooks/useDoctorStaff";
import { formatDate } from "../shared/helpers";
import { Avatar } from "../shared/ui";
import ConfirmDialog from "../shared/ConfirmDialog";
import { Section } from "./ui";

// "Clinic Staff" on the doctor's profile:
//   - receptionists working with this doctor (can be removed, after a confirmation)
//   - requests from receptionists waiting for the doctor to accept or decline
// It loads and saves by itself, so it does not depend on the profile form.
export default function StaffSection() {
  const { receptionists, requests, loading, busy, error, message, reload, respond, remove } = useDoctorStaff();
  const [removing, setRemoving] = useState(null); // the row waiting for confirmation

  async function confirmRemove() {
    await remove(removing.assignmentId);
    setRemoving(null);
  }

  return (
    <Section title="Clinic Staff" icon={Users}>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-6">
          {message && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}{" "}
              <button onClick={reload} className="font-semibold underline">
                Retry
              </button>
            </p>
          )}

          {/* Requests waiting for the doctor */}
          {requests.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock size={15} className="text-amber-600" /> Assignment Requests ({requests.length})
              </h3>
              <ul className="space-y-3">
                {requests.map((row) => (
                  <li key={row.assignmentId} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar src={row.receptionist.profilePhoto} name={row.receptionist.fullName} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{row.receptionist.fullName}</p>
                        <p className="break-all text-xs text-gray-500">{row.receptionist.email}</p>
                        <p className="text-xs text-gray-400">
                          Requested {formatDate(row.requestedAt)}
                          {row.expired && " · expired"}
                        </p>
                      </div>
                    </div>

                    {!row.expired && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => respond(row.assignmentId, "reject")}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-sm hover:bg-white disabled:opacity-50"
                        >
                          <X size={14} /> Decline
                        </button>
                        <button
                          onClick={() => respond(row.assignmentId, "accept")}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          <Check size={14} /> Accept
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Active receptionists */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Receptionists ({receptionists.length})</h3>

            {receptionists.length === 0 ? (
              <p className="text-sm text-gray-500">No receptionist is assigned to you yet.</p>
            ) : (
              <ul className="space-y-3">
                {receptionists.map((row) => (
                  <li key={row.assignmentId} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar src={row.receptionist.profilePhoto} name={row.receptionist.fullName} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{row.receptionist.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {[row.receptionist.phone, row.receptionist.email].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-xs text-gray-400">Working with you since {formatDate(row.since)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setRemoving(row)}
                      disabled={busy}
                      className="flex shrink-0 items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <UserMinus size={14} /> Remove Assignment
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {removing && (
        <ConfirmDialog
          title="Remove Receptionist?"
          message={`${removing.receptionist.fullName} will no longer manage your appointments. Existing patient records and appointment history will be kept.`}
          confirmText="Remove Assignment"
          busy={busy}
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </Section>
  );
}
