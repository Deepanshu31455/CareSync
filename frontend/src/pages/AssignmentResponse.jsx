import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import { API_BASE } from "../config";
import { formatDate } from "../components/shared/helpers";
import { Avatar, Card } from "../components/shared/ui";

// The page opened from the email a doctor receives.
// No login needed: the secret token in the link is the proof. Opening the page only
// SHOWS the request; nothing changes until the doctor presses Accept or Decline.
export default function AssignmentResponse() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [request, setRequest] = useState(null); // details shown to the doctor
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [outcome, setOutcome] = useState(null); // message after answering

  // GET the request details once
  useEffect(() => {
    async function loadRequest() {
      try {
        if (!token) throw new Error("This link is incomplete.");

        const res = await fetch(`${API_BASE}/assignments/preview?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.message || "Could not open this request.");
        setRequest(result.request);
      } catch (err) {
        setError(err.message || "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadRequest();
  }, [token]);

  // POST the doctor's answer
  async function answer(action) {
    try {
      setSending(true);
      setError(null);

      const res = await fetch(`${API_BASE}/assignments/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not send your answer.");
      setOutcome({ accepted: action === "accept", message: result.message });
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
      <Card className="w-full text-center">
        {loading && <p className="text-sm text-slate-600">Opening request...</p>}

        {/* The request is not valid (used, expired, cancelled, wrong link) */}
        {!loading && !request && !outcome && (
          <div className="space-y-4">
            <XCircle size={40} className="mx-auto text-red-500" />
            <p className="text-sm text-slate-700">{error}</p>
            <Link to="/" className="inline-block text-sm font-medium text-blue-600 hover:underline">
              Go to CareSync
            </Link>
          </div>
        )}

        {/* Answered */}
        {outcome && (
          <div className="space-y-4">
            {outcome.accepted ? (
              <CheckCircle2 size={40} className="mx-auto text-green-600" />
            ) : (
              <XCircle size={40} className="mx-auto text-slate-500" />
            )}
            <p className="font-serif text-lg font-semibold text-slate-900">{outcome.message}</p>
            <Link to="/login" className="inline-block text-sm font-medium text-blue-600 hover:underline">
              Sign in to CareSync
            </Link>
          </div>
        )}

        {/* Waiting for the doctor's answer */}
        {request && !outcome && (
          <div className="space-y-5">
            <Avatar src={request.receptionist.profilePhoto} name={request.receptionist.fullName} className="mx-auto h-20 w-20 text-2xl" />

            <div>
              <h1 className="font-serif text-xl font-semibold text-slate-900">Receptionist request</h1>
              <p className="mt-2 text-sm text-slate-600">
                <b>{request.receptionist.fullName}</b> ({request.receptionist.email}) wants to manage appointments for
                Dr. {request.doctorName}.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                They get no access until you accept. Valid until {formatDate(request.expiresAt)}.
              </p>
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <div className="flex justify-center gap-3">
              <button
                onClick={() => answer("reject")}
                disabled={sending}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={() => answer("accept")}
                disabled={sending}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Please wait..." : "Accept"}
              </button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
