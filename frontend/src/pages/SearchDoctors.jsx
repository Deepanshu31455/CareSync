import { useState } from "react";

import useDoctorSearch from "../hooks/useDoctorSearch";
import useMyBookings from "../hooks/useMyBookings";
import { addDays, todayIST } from "../utils/dates";

import { EmptyState, ErrorState } from "../components/shared/ui";
import SearchBar from "../components/search/SearchBar";
import DoctorCard from "../components/search/DoctorCard";
import DoctorModal from "../components/search/DoctorModal";
import MyQueuePanel from "../components/search/MyQueuePanel";

const WINDOW_DAYS = 14; // the same limit as the server

// The patient's page: follow today's queue, find a doctor, book.
export default function SearchDoctors() {
  const mine = useMyBookings();
  const today = mine.today;

  const [text, setText] = useState("");
  const [pickedDate, setPickedDate] = useState(null); // null = today
  const [consultingOnly, setConsultingOnly] = useState(false);
  const [opened, setOpened] = useState(null); // the doctor whose window is open

  const date = pickedDate && pickedDate >= today ? pickedDate : today;
  const { doctors, loading, error, retry } = useDoctorSearch({ text, date, consultingOnly });

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-slate-900">Find a doctor</h1>
        <p className="mt-1 text-sm text-slate-500">Search, choose a day when the doctor consults, pay and get your token.</p>
      </div>

      <MyQueuePanel
        bookings={mine.bookings}
        live={mine.live}
        connection={mine.connection}
        notice={mine.notice}
        error={mine.error}
        today={today}
        onCancel={mine.cancel}
      />

      <SearchBar
        text={text}
        onText={setText}
        date={date}
        onDate={setPickedDate}
        min={today}
        max={addDays(todayIST(), WINDOW_DAYS)}
        consultingOnly={consultingOnly}
        onConsultingOnly={setConsultingOnly}
      />

      {error ? (
        <ErrorState text={error} onRetry={retry} />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState text="No doctors found. Try another name, another day, or switch off the consulting filter." />
      ) : (
        <ul className="space-y-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} today={today} onOpen={setOpened} />
          ))}
        </ul>
      )}

      {opened && (
        <DoctorModal
          doctorId={opened.id}
          firstDate={date}
          onClose={() => setOpened(null)}
          onBooked={() => {
            mine.reload();
            retry(); // the doctor cards show the new queue numbers
          }}
        />
      )}
    </div>
  );
}
