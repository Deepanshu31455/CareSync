import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setDoctorData,
  setLoading,
  setSaving,
  setError,
  setSuccessMessage,
  clearMessages,
  patchDoctorData,
} from "../redux/doctorSlice";
import { setUser } from "../redux/authslice";

import { BASE } from "../components/doctorProfile/constants";
import { buildForm } from "../components/doctorProfile/profileForm";
import { isValidRange, parseTimeRange } from "../components/doctorProfile/timeUtils";

export default function useDoctorProfile() {
  const dispatch = useDispatch();

  const { data: doctor, loading, saving, error, successMessage } = useSelector(
    (state) => state.doctor
  );
  const currentUser = useSelector((state) => state.authStore.user);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function fetchDoctorProfile() {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const res = await fetch(`${BASE}/doctor/profile`, {
        method: "GET",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Could not load doctor profile.");
      }
      dispatch(setDoctorData(result.doctor));
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
    } finally {
      dispatch(setLoading(false));
    }
  }

  useEffect(() => {
    fetchDoctorProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the editable form in sync with the saved profile.
  useEffect(() => {
    if (doctor) setForm(buildForm(doctor));
  }, [doctor]);

  // Auto-clear messages after four seconds.
  useEffect(() => {
    if (!error && !successMessage) return;
    const timer = setTimeout(() => dispatch(clearMessages()), 4000);
    return () => clearTimeout(timer);
  }, [error, successMessage, dispatch]);

  function changeField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Updates one day's working hours: { isClosed } and/or { start, end }.
  function changeDay(index, changes) {
    setForm((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((slot, i) => {
        if (i !== index) return slot;

        const closed = changes.isClosed ?? slot.isClosed;
        if (closed) return { ...slot, isClosed: true, time: "Closed" };

        const current = parseTimeRange(slot.time);
        const start = changes.start ?? current.start;
        const end = changes.end ?? current.end;
        return { ...slot, isClosed: false, time: `${start} – ${end}` };
      }),
    }));
  }

  // Photo upload is only reachable in edit mode (the UI enforces this too).
  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !editing) return;

    if (!file.type.startsWith("image/")) {
      dispatch(setError("Please select an image file."));
      return;
    }

    try {
      setUploading(true);
      dispatch(setError(null));

      const formData = new FormData();
      formData.append("imageFile", file);
      formData.append("id", doctor?.id || currentUser?.id || doctor?._id);
      formData.append("role", "doctor");

      const res = await fetch(`${BASE}/imageUpload`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Photo upload failed.");

      const photoUrl = result.profilePhoto;
      if (!photoUrl) {
        throw new Error("The server did not return a profile photo URL.");
      }

      changeField("profilePhoto", photoUrl);
      dispatch(patchDoctorData({ profilePhoto: photoUrl }));
      if (currentUser) {
        dispatch(setUser({ ...currentUser, profilePhoto: photoUrl }));
      }
      dispatch(setSuccessMessage("Profile photo updated successfully."));
    } catch (err) {
      dispatch(setError(err.message || "Photo upload failed."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveProfile() {
    // Validate working hours before sending.
    const badDay = form.workingHours.find((slot) => {
      if (slot.isClosed) return false;
      const { start, end } = parseTimeRange(slot.time);
      return !isValidRange(start, end);
    });

    if (badDay) {
      dispatch(setError(`${badDay.day}: closing time must be after opening time.`));
      return;
    }

    try {
      dispatch(setSaving(true));
      dispatch(setError(null));
      dispatch(setSuccessMessage(null));

      const res = await fetch(`${BASE}/doctor/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not save profile.");

      dispatch(setDoctorData(result.doctor));
      dispatch(setSuccessMessage("Profile updated successfully."));
      setEditing(false);
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
    } finally {
      dispatch(setSaving(false));
    }
  }

  function cancelEditing() {
    if (doctor) setForm(buildForm(doctor));
    setEditing(false);
    dispatch(clearMessages());
  }

  return {
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
  };
}
