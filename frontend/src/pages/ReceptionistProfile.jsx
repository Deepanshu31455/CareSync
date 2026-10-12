import { useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

import useReceptionistProfile from "../hooks/useReceptionistProfile";
import { TABS } from "../components/receptionistProfile/constants";
import { ErrorState, Messages } from "../components/shared/ui";

import ProfileHeader from "../components/shared/ProfileHeader";
import PersonalInfoTab from "../components/receptionistProfile/PersonalInfoTab";
import ServingDoctorsTab from "../components/receptionistProfile/ServingDoctorsTab";
import RequestsTab from "../components/receptionistProfile/RequestsTab";

// The Receptionist Profile page. Everything it shows comes from Redux (via the hook).
// The navbar (Home, Dashboard, Logout) is shared by the app and not repeated here.
export default function ReceptionistProfile() {
  const [activeTab, setActiveTab] = useState("personal");

  const {
    profile,
    doctors,
    requests,
    loading,
    saving,
    error,
    successMessage,
    reload,
    saveProfile,
    changePhoto,
    searchDoctors,
    sendRequest,
    cancelRequest,
    removeAssignment,
  } = useReceptionistProfile();

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

  // Small number next to a section name in the menu
  const counts = { doctors: doctors.length, requests: requests.length };

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

      <Messages success={successMessage} error={error} />

      <ProfileHeader
        name={profile.fullName || "Receptionist"}
        idLabel="Receptionist ID"
        id={profile.id}
        email={profile.email}
        photo={profile.profilePhoto}
        saving={saving}
        onChangePhoto={changePhoto}
      />

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
              {counts[key] > 0 && (
                <span className="ml-auto rounded-full bg-blue-600 px-2 text-xs text-white">{counts[key]}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div className="min-w-0 flex-1">
          {activeTab === "personal" && <PersonalInfoTab profile={profile} saving={saving} onSave={saveProfile} />}

          {activeTab === "doctors" && (
            <ServingDoctorsTab
              doctors={doctors}
              saving={saving}
              onRemove={removeAssignment}
              onSearch={searchDoctors}
              onSend={sendRequest}
            />
          )}

          {activeTab === "requests" && <RequestsTab requests={requests} saving={saving} onCancel={cancelRequest} />}
        </div>
      </div>
    </main>
  );
}
