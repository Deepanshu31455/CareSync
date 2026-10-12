import { IndianRupee, MapPin } from "lucide-react";
import { formatMoney } from "../shared/helpers";
import { Avatar } from "../shared/ui";

// One doctor in a list: photo, name, specialization, fee, clinic.
// Whatever is passed as children (buttons, a status) is shown on the right.
//   doctor = { fullName, specialization, profilePhoto, clinicAddress, consultationFee }
//   note   = small grey line under the details, e.g. "Connected since 12 Mar 2026"
export default function DoctorRow({ doctor, note, children }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={doctor.profilePhoto} name={doctor.fullName} />

        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">Dr. {doctor.fullName}</p>
          <p className="text-sm text-slate-600">{doctor.specialization || "Specialization not added"}</p>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {doctor.consultationFee > 0 && (
              <span className="flex items-center gap-1">
                <IndianRupee size={12} /> {formatMoney(doctor.consultationFee)} consultation
              </span>
            )}
            {doctor.clinicAddress && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> <span className="truncate">{doctor.clinicAddress}</span>
              </span>
            )}
          </div>
          {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </li>
  );
}
