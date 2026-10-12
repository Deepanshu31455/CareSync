import { useState } from "react";
import { UserMinus } from "lucide-react";
import { formatDate } from "../shared/helpers";
import { Card, EmptyState, TabTitle } from "../shared/ui";
import ConfirmDialog from "../shared/ConfirmDialog";
import DoctorRow from "./DoctorRow";
import AddDoctorPanel from "./AddDoctorPanel";

// Connected doctors (with Remove Assignment) and the "Add a Doctor" search.
//   doctors  = [{ assignmentId, since, doctor }]
//   onRemove = (assignmentId) => Promise<boolean>
export default function ServingDoctorsTab({ doctors, saving, onRemove, onSearch, onSend }) {
  const [removing, setRemoving] = useState(null); // the row waiting for confirmation

  async function confirmRemove() {
    await onRemove(removing.assignmentId);
    setRemoving(null);
  }

  return (
    <div className="space-y-5">
      <Card>
        <TabTitle hint="Doctors who accepted you. You can remove one at any time.">
          Serving Doctors ({doctors.length})
        </TabTitle>

        {doctors.length === 0 ? (
          <EmptyState text="No doctors yet. Search below and send a request; the doctor appears here after accepting." />
        ) : (
          <ul className="space-y-3">
            {doctors.map((row) => (
              <DoctorRow key={row.assignmentId} doctor={row.doctor} note={`Connected since ${formatDate(row.since)}`}>
                <button
                  onClick={() => setRemoving(row)}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <UserMinus size={14} /> Remove Assignment
                </button>
              </DoctorRow>
            ))}
          </ul>
        )}
      </Card>

      <AddDoctorPanel saving={saving} onSearch={onSearch} onSend={onSend} />

      {removing && (
        <ConfirmDialog
          title="Remove Doctor?"
          message={`Are you sure you want to remove Dr. ${removing.doctor.fullName} from your serving doctors list? The assignment will end. Existing patient records and appointment history will be kept.`}
          confirmText="Remove Assignment"
          busy={saving}
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
