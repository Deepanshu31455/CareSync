import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Home } from "lucide-react";

import usePatientProfile from "../hooks/usePatientProfile";
import { TABS } from "../components/patientProfile/constants";
import { ErrorState } from "../components/patientProfile/ui";

import ProfileHeader from "../components/shared/ProfileHeader";
import PersonalInfoTab from "../components/patientProfile/PersonalInfoTab";
import ConsultationsTab from "../components/patientProfile/ConsultationsTab";
import DocumentsTab from "../components/patientProfile/DocumentsTab";
import BillsTab from "../components/patientProfile/BillsTab";

// The Patient Profile page. Everything it shows comes from Redux (via the hook).
// The navbar (Home, Dashboard, Logout) is shared by the app and not repeated here.
export default function PatientProfile() {
  const [activeTab, setActiveTab] = useState("personal");

  const {
    profile,
    consultations,
    prescriptions,
    reports,
    bills,
    loading,
    saving,
    error,
    successMessage,
    reload,
    saveProfile,
    changePhoto,
    addDocument,
    deleteDocument,
  } = usePatientProfile();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return <ErrorState text={error || "Profile not found."} onRetry={reload} />;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      {/* Home button, top left. Change "/" if your homepage is on another path. */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Home size={16} />
        Home
      </Link>
      

      {/* Success and error messages */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <ProfileHeader profile={profile} saving={saving} onChangePhoto={changePhoto} />

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        {/* Section menu: a scrolling row on mobile, a side menu on desktop */}
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:px-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition md:rounded-xl md:py-2.5 ${
                activeTab === key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div className="min-w-0 flex-1">
          {activeTab === "personal" && (
            <PersonalInfoTab profile={profile} saving={saving} onSave={saveProfile} />
          )}

          {activeTab === "consultations" && (
            <ConsultationsTab
              consultations={consultations}
              prescriptions={prescriptions}
              reports={reports}
              bills={bills}
            />
          )}

          {activeTab === "prescriptions" && (
            <DocumentsTab
              kind="prescriptions"
              items={prescriptions}
              saving={saving}
              onUpload={(values, file) => addDocument("prescriptions", values, file)}
              onDelete={(id) => deleteDocument("prescriptions", id)}
            />
          )}

          {activeTab === "reports" && (
            <DocumentsTab
              kind="reports"
              items={reports}
              saving={saving}
              onUpload={(values, file) => addDocument("reports", values, file)}
              onDelete={(id) => deleteDocument("reports", id)}
            />
          )}

          {activeTab === "bills" && (
            <BillsTab
              bills={bills}
              saving={saving}
              onUpload={(values, file) => addDocument("bills", values, file)}
              onDelete={(id) => deleteDocument("bills", id)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
