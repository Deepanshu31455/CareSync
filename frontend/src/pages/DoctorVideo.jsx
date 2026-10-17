import { Video } from "lucide-react";

import DoctorNavbar from "../components/doctorWorkspace/DoctorNavbar";
import WorkspaceTabs from "../components/doctorWorkspace/WorkspaceTabs";
import { Card } from "../components/shared/ui";

// The doctor's workspace for video consultations: its own address, built later.
export default function DoctorVideo() {
  return (
    <>
    <DoctorNavbar />
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold text-slate-900">Video visits</h1>
        <WorkspaceTabs />
      </div>

      <Card>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Video size={36} className="text-slate-300" />
          <p className="font-semibold text-slate-700">Video consultations are coming soon</p>
          <p className="max-w-md text-sm text-slate-500">
            Patients can book physical visits for now. When video visits start, their queue and tools will appear here,
            separate from your clinic workspace.
          </p>
        </div>
      </Card>
    </div>
    </>
  );
}
