// How a video visit looks on the doctor's screen
export const VIDEO_STATUS = {
  waiting: { label: "Waiting", className: "bg-amber-50 text-amber-700 border-amber-200" },
  in_consultation: { label: "In call", className: "bg-green-50 text-green-700 border-green-200" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  no_show: { label: "No-show", className: "bg-orange-50 text-orange-700 border-orange-200" },
};

export const VIDEO_FINISHED = ["completed", "cancelled", "no_show"];
