import { Avatar } from "../shared/ui";

// One button per doctor the receptionist works for. Shows the doctor's 6-digit ID.
//   doctors = [{ id, fullName, specialization, profilePhoto }]     selectedId = the chosen doctor's 6-digit ID
export default function DoctorPicker({ doctors, selectedId, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {doctors.map((doctor) => {
        const chosen = doctor.id === selectedId;
        return (
          <button
            key={doctor.id}
            onClick={() => onSelect(doctor.id)}
            aria-pressed={chosen}
            className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-left transition ${
              chosen ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <Avatar src={doctor.profilePhoto} name={doctor.fullName} className="h-9 w-9 text-sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">Dr. {doctor.fullName}</span>
              <span className="block text-xs text-slate-500">ID {doctor.id}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
