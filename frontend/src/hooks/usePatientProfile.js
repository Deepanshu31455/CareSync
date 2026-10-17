import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setPatientData,
  setProfile,
  patchProfile,
  addItem,
  removeItem,
  setLoading,
  setSaving,
  setError,
  setSuccessMessage,
  clearMessages,
} from "../redux/patientSlice";
import { setUser } from "../redux/authSlice";

import { BASE, ENDPOINTS, KINDS } from "../components/patientProfile/constants";

// All the data and actions of the Patient Profile page.
// Every result is stored in Redux (state.patient); the components read it from here.
// The addresses and response shapes are listed in constants.js.
export default function usePatientProfile() {
  const dispatch = useDispatch();

  /* ---------- 1. Data from Redux ---------- */

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
  } = useSelector((state) => state.patient);

  // The logged-in user (used to keep the navbar photo in sync)
  const currentUser = useSelector((state) => state.authStore.user);

  /* ---------- 2. Loading everything ---------- */

  async function loadPatientData() {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // GET the personal details and the records together
      const [profileRes, recordsRes] = await Promise.all([
        fetch(`${BASE}${ENDPOINTS.profile}`, { method: "GET", credentials: "include" }),
        fetch(`${BASE}${ENDPOINTS.records}`, { method: "GET", credentials: "include" }),
      ]);
      const profileResult = await profileRes.json();
      const recordsResult = await recordsRes.json();

      if (!profileRes.ok) {
        throw new Error(profileResult.message || "Could not load your profile.");
      }
      if (!recordsRes.ok) {
        throw new Error(recordsResult.message || "Could not load your records.");
      }

      dispatch(
        setPatientData({
          profile: profileResult.patient,
          consultations: recordsResult.consultations || [],
          prescriptions: recordsResult.prescriptions || [],
          reports: recordsResult.reports || [],
          bills: recordsResult.bills || [],
        })
      );
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
    } finally {
      dispatch(setLoading(false));
    }
  }

  // Load once, when the page opens.
  useEffect(() => {
    loadPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide success/error messages after 4 seconds.
  // Not while the profile is missing, so a load error stays visible.
  useEffect(() => {
    if (!profile || (!error && !successMessage)) return;

    const timer = setTimeout(() => dispatch(clearMessages()), 4000);
    return () => clearTimeout(timer);
  }, [error, successMessage, profile, dispatch]);

  /* ---------- 3. Actions ---------- */
  // Each action returns true on success and false on failure,
  // so a form knows whether to close or clear itself.

  // Save the edited personal details (PUT as JSON)
  async function saveProfile(form) {
    try {
      dispatch(setSaving(true));
      dispatch(clearMessages());

      const res = await fetch(`${BASE}${ENDPOINTS.profile}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not save your profile.");

      dispatch(setProfile(result.patient));
      dispatch(setSuccessMessage("Profile updated successfully."));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  // Upload a new profile photo (PUT as form data)
  async function changePhoto(file) {
    try {
      dispatch(setSaving(true));
      dispatch(clearMessages());

      const formData = new FormData();
      formData.append("imageFile", file);

      const res = await fetch(`${BASE}${ENDPOINTS.photo}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Photo upload failed.");
      if (!result.profilePhoto) throw new Error("The server did not return a photo link.");

      // Show the new photo in the profile and in the navbar's logged-in user
      dispatch(patchProfile({ profilePhoto: result.profilePhoto }));
      if (currentUser) {
        dispatch(setUser({ ...currentUser, profilePhoto: result.profilePhoto }));
      }

      dispatch(setSuccessMessage("Profile photo updated successfully."));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Photo upload failed."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  // Upload a prescription, test report or bill (POST as form data).
  // kind = "prescriptions" | "reports" | "bills"
  async function addDocument(kind, values, file) {
    try {
      dispatch(setSaving(true));
      dispatch(clearMessages());

      const formData = new FormData();
      formData.append("file", file);
      Object.entries(values).forEach(([name, value]) => formData.append(name, value));

      const res = await fetch(`${BASE}${ENDPOINTS[kind]}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Upload failed.");

      dispatch(addItem({ kind, item: result.item }));
      dispatch(setSuccessMessage(`${KINDS[kind].label} uploaded successfully.`));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  // Delete a prescription, test report or bill (DELETE)
  async function deleteDocument(kind, id) {
    try {
      dispatch(setSaving(true));
      dispatch(clearMessages());

      const res = await fetch(`${BASE}${ENDPOINTS[kind]}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not delete it.");

      dispatch(removeItem({ kind, id }));
      dispatch(setSuccessMessage(`${KINDS[kind].label} deleted.`));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  /* ---------- 4. What the page can use ---------- */

  return {
    // data
    profile,
    consultations,
    prescriptions,
    reports,
    bills,

    // status
    loading,
    saving,
    error,
    successMessage,

    // actions
    reload: loadPatientData,
    saveProfile,
    changePhoto,
    addDocument,
    deleteDocument,
  };
}
