// Settings of the receptionist's queue screen

// How each status looks. Active = still in the queue; finished rows are tucked below.
export const STATUS = {
  waiting: { label: "Waiting", className: "bg-amber-50 text-amber-700 border-amber-200" },
  in_consultation: { label: "With doctor", className: "bg-green-50 text-green-700 border-green-200" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  no_show: { label: "No-show", className: "bg-orange-50 text-orange-700 border-orange-200" },
  rescheduled: { label: "Rescheduled", className: "bg-purple-50 text-purple-700 border-purple-200" },
};

export const FINISHED = ["completed", "cancelled", "no_show", "rescheduled"];

// Same values as the server's walk-in gender list
export const WALK_IN_GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

// The little pill that shows whether live updates are working
export const CONNECTION = {
  live: { label: "Live", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  connecting: { label: "Connecting...", className: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  offline: { label: "Offline - refreshing every 10 s", className: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};
