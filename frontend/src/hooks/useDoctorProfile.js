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
import {
  isValidRange,
  parseTimeRange,
} from "../components/doctorProfile/timeUtils";

// Looks through the working hours and returns an error message for the first
// open day whose closing time is not after its opening time.
// Returns null when everything is fine.
function getWorkingHoursError(workingHours) {
  for (const slot of workingHours) {
    if (slot.isClosed) continue; // closed days have no times to check

    const { start, end } = parseTimeRange(slot.time);
    if (!isValidRange(start, end)) {
      return `${slot.day}: closing time must be after opening time.`;
    }
  }
  return null;
}

export default function useDoctorProfile() {
  const dispatch = useDispatch();

  /* ---------- 1. Data from Redux ---------- */

  // doctor = the saved profile, the rest control the loading/error UI
  const {
    data: doctor,
    loading,
    saving,
    error,
    successMessage,
  } = useSelector((state) => state.doctor);

  // The logged-in user (used to find the id and to update their photo)
  const currentUser = useSelector((state) => state.authStore.user);

  /* ---------- 2. Local state ---------- */

  const [editing, setEditing] = useState(false); // is Edit mode on?
  const [form, setForm] = useState(null); // editable copy of the profile
  const [uploading, setUploading] = useState(false); // is a photo uploading?

  /* ---------- 3. Loading the profile ---------- */

  async function fetchDoctorProfile() {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // GET the doctor's profile
      const res = await fetch(`${BASE}/doctor/profile`, {
        method: "GET",
        credentials: "include", // send the login cookie
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

  // Load the profile once, when the page opens.
  useEffect(() => {
    fetchDoctorProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the saved profile changes, refresh the editable copy.
  useEffect(() => {
    if (doctor) setForm(buildForm(doctor));
  }, [doctor]);

  // Hide success/error messages automatically after 4 seconds.
  useEffect(() => {
    if (!error && !successMessage) return;

    const timer = setTimeout(() => dispatch(clearMessages()), 4000);
    return () => clearTimeout(timer); // cancel the timer if the message changes
  }, [error, successMessage, dispatch]);

  /* ---------- 4. Editing the form ---------- */

  // Changes one field of the form, e.g. changeField("phone1", "9876543210").
  function changeField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Changes one day of the working hours.
  //   changes = { isClosed }  -> switch the day Open / Closed
  //   changes = { start }     -> change the opening time
  //   changes = { end }       -> change the closing time
  function changeDay(index, changes) {
    setForm((prev) => ({
      ...prev,
      workingHours: prev.workingHours.map((slot, i) => {
        if (i !== index) return slot; // leave the other days untouched

        const closed = changes.isClosed ?? slot.isClosed;

        // Closed day: no times needed
        if (closed) return { ...slot, isClosed: true, time: "Closed" };

        // Open day: keep the old time for whatever was not changed
        const current = parseTimeRange(slot.time);
        const start = changes.start ?? current.start;
        const end = changes.end ?? current.end;
        return { ...slot, isClosed: false, time: `${start} – ${end}` };
      }),
    }));
  }

  /* ---------- 5. Uploading the profile photo ---------- */

  // Called when the doctor picks an image (only possible in Edit mode).
  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !editing) return;

    // Only images are allowed
    if (!file.type.startsWith("image/")) {
      dispatch(setError("Please select an image file."));
      return;
    }

    try {
      setUploading(true);
      dispatch(setError(null));

      // Send the file as form data
      const formData = new FormData();
      formData.append("imageFile", file);
      formData.append("id", doctor?.id || currentUser?.id || doctor?._id);
      formData.append("role", "doctor");

      // PUT the image to the backend
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

      // Show the new photo everywhere: form, saved profile and logged-in user
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
      event.target.value = ""; // lets the same file be picked again later
    }
  }

  /* ---------- 6. Saving and cancelling ---------- */

  async function saveProfile() {
    // Check the working hours first, and stop if something is wrong.
    const hoursError = getWorkingHoursError(form.workingHours);
    if (hoursError) {
      dispatch(setError(hoursError));
      return;
    }

    try {
      dispatch(setSaving(true));
      dispatch(setError(null));
      dispatch(setSuccessMessage(null));

      // PUT the edited profile to the backend
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
      setEditing(false); // leave Edit mode after a successful save
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
    } finally {
      dispatch(setSaving(false));
    }
  }

  // Throw away unsaved changes and leave Edit mode.
  function cancelEditing() {
    if (doctor) setForm(buildForm(doctor)); // go back to the saved data
    setEditing(false);
    dispatch(clearMessages());
  }

  /* ---------- 7. What the page can use ---------- */

  return {
    // data
    doctor,
    form,

    // status
    loading,
    saving,
    uploading,
    editing,
    error,
    successMessage,

    // actions
    setEditing,
    fetchDoctorProfile,
    changeField,
    changeDay,
    uploadPhoto,
    saveProfile,
    cancelEditing,
  };
}