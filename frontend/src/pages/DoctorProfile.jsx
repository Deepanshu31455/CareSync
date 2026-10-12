import { AlertCircle, CheckCircle2 } from "lucide-react";

import useDoctorProfile from "../hooks/useDoctorProfile";
import { buildForm } from "../components/doctorProfile/profileForm";

import { DUMMY_RATING, DUMMY_REVIEWS } from "../components/doctorProfile/constants";
import RatingsSection from "../components/doctorProfile/RatingsSection";
import ProfileNavbar from "../components/doctorProfile/ProfileNavbar";
import ProfileHeader from "../components/doctorProfile/ProfileHeader";
import ContactSection from "../components/doctorProfile/ContactSection";
import WorkingHoursSection from "../components/doctorProfile/WorkingHoursSection";
import FeesSection from "../components/doctorProfile/FeesSection";
import FacilitiesSection from "../components/doctorProfile/FacilitiesSection";
import AboutSection from "../components/doctorProfile/AboutSection";
import DirectionsSection from "../components/doctorProfile/DirectionsSection";
import StaffSection from "../components/doctorProfile/StaffSection";


export default function DoctorProfile() {
  const {
    doctor,
    form,
    loading,
    saving,
    error,
    successMessage,
    editing,
    uploading,
    setEditing,
    fetchDoctorProfile,
    changeField,
    changeDay,
    uploadPhoto,
    saveProfile,
    cancelEditing,
  } = useDoctorProfile();

  if (loading && !doctor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (!doctor || !form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
        <AlertCircle size={40} className="text-red-500" />
        <p className="text-gray-700">{error || "Doctor profile not found."}</p>
        <button
          onClick={fetchDoctorProfile}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Saved data when viewing; live form while editing.
  const d = editing ? form : buildForm(doctor);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <ProfileNavbar
        editing={editing}
        saving={saving}
        onEdit={() => setEditing(true)}
        onCancel={cancelEditing}
        onSave={saveProfile}
      />

      <div className="mx-auto max-w-5xl space-y-3 px-4 pt-4 sm:px-6">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </div>

      <main className="mx-auto max-w-5xl space-y-5 px-4 pt-5 sm:px-6">
        <ProfileHeader
          doctor={doctor}
          d={d}
          editing={editing}
          uploading={uploading}
          onChange={changeField}
          onUpload={uploadPhoto}
          rating={DUMMY_RATING}
        />

        <ContactSection doctor={doctor} d={d} editing={editing} onChange={changeField} />

        <WorkingHoursSection d={d} editing={editing} onChangeDay={changeDay} />

        <FeesSection d={d} editing={editing} onChange={changeField} />

        <RatingsSection rating={DUMMY_RATING} reviews={DUMMY_REVIEWS} />

        <FacilitiesSection d={d} editing={editing} onChange={changeField} />

        <AboutSection d={d} editing={editing} onChange={changeField} />

        <DirectionsSection d={d} editing={editing} onChange={changeField} />

        <StaffSection />
      </main>
    </div>
  );
}
