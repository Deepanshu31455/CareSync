import { useEffect, useRef, useState } from "react";
import { Search, Send } from "lucide-react";
import { SEARCH } from "./constants";
import { inputClass } from "../shared/constants";
import { Card, TabTitle } from "../shared/ui";
import DoctorRow from "./DoctorRow";

// Search a doctor and send an assignment request. The doctor gets an email and
// nothing is connected until they accept.
//   onSearch  = (text) => Promise<{ doctors, error }>
//   onSend    = (doctorId) => Promise<boolean>
export default function AddDoctorPanel({ saving, onSearch, onSend }) {
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const latest = useRef(0); // ignores an old search that finishes after a newer one

  // Search a moment after the receptionist stops typing
  useEffect(() => {
    const query = text.trim();

    if (query.length < SEARCH.minChars) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const myTurn = ++latest.current;
    setSearching(true);

    const timer = setTimeout(async () => {
      const { doctors, error } = await onSearch(query);
      if (myTurn !== latest.current) return; // a newer search has started

      setResults(doctors);
      setSearchError(error);
      setSearching(false);
    }, SEARCH.delayMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  async function send(doctorId) {
    const worked = await onSend(doctorId);
    // Once sent, the doctor is no longer something to pick
    if (worked) setResults((prev) => prev.filter((d) => d._id !== doctorId));
  }

  const showEmpty = text.trim().length >= SEARCH.minChars && !searching && !searchError && results.length === 0;

  return (
    <Card>
      <TabTitle hint="Search for a doctor and ask for permission to manage their appointments. They get an email and must accept first.">
        Add a Doctor
      </TabTitle>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={`${inputClass} pl-9`}
          placeholder="Search by doctor's name or specialization"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="mt-4">
        {searching && <p className="text-sm text-slate-500">Searching...</p>}
        {searchError && <p className="text-sm text-red-600">{searchError}</p>}
        {showEmpty && <p className="text-sm text-slate-500">No matching doctors found.</p>}

        {results.length > 0 && (
          <ul className="space-y-3">
            {results.map((doctor) => (
              <DoctorRow key={doctor._id} doctor={doctor}>
                <button
                  onClick={() => send(doctor._id)}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={14} /> Send Request
                </button>
              </DoctorRow>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
