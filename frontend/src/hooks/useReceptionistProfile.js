import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setReceptionistData,
  setProfile,
  patchProfile,
  addRequest,
  removeRequest,
  removeDoctor,
  setLoading,
  setSaving,
  setError,
  setSuccessMessage,
  clearMessages,
} from "../redux/receptionistSlice";
import { setUser } from "../redux/authSlice";

import { BASE, ENDPOINTS } from "../components/receptionistProfile/constants";

// All the data and actions of the Receptionist Profile page.
// Every result is stored in Redux (state.receptionist); the components read it from here.
// The addresses and response shapes are listed in components/receptionistProfile/constants.js.
export default function useReceptionistProfile() {
  const dispatch = useDispatch();

  /* ---------- 1. Data from Redux ---------- */

  const { profile, doctors, requests, loading, saving, error, successMessage } = useSelector(
    (state) => state.receptionist
  );

  // The logged-in user (used to keep the navbar photo in sync)
  const currentUser = useSelector((state) => state.authStore.user);

  /* ---------- 2. Loading everything ---------- */

  async function loadReceptionistData() {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // GET the personal details and the doctors together
      const [profileRes, doctorsRes] = await Promise.all([
        fetch(`${BASE}${ENDPOINTS.profile}`, { method: "GET", credentials: "include" }),
        fetch(`${BASE}${ENDPOINTS.doctors}`, { method: "GET", credentials: "include" }),
      ]);
      const profileResult = await profileRes.json();
      const doctorsResult = await doctorsRes.json();

      if (!profileRes.ok) throw new Error(profileResult.message || "Could not load your profile.");
      if (!doctorsRes.ok) throw new Error(doctorsResult.message || "Could not load your doctors.");

      dispatch(
        setReceptionistData({
          profile: profileResult.receptionist,
          doctors: doctorsResult.doctors || [],
          requests: doctorsResult.requests || [],
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
    loadReceptionistData();
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

      dispatch(setProfile(result.receptionist));
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
      if (currentUser) dispatch(setUser({ ...currentUser, profilePhoto: result.profilePhoto }));

      dispatch(setSuccessMessage("Profile photo updated successfully."));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Photo upload failed."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  // Search doctors by name or specialization (GET).
  // Not stored in Redux: the results only matter to the search box.
  // Returns { doctors, error }.
  async function searchDoctors(text) {
    try {
      const res = await fetch(`${BASE}${ENDPOINTS.search}?q=${encodeURIComponent(text)}`, {
        method: "GET",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Search failed.");
      return { doctors: result.doctors || [], error: null };
    } catch (err) {
      return { doctors: [], error: err.message || "Could not connect to the server." };
    }
  }

  // Ask a doctor to accept this receptionist (POST). The doctor is emailed.
  async function sendRequest(doctorId) {
    try {
      dispatch(setSaving(true));
      dispatch(clearMessages());

      const res = await fetch(`${BASE}${ENDPOINTS.requests}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not send the request.");

      dispatch(addRequest(result.request));
      dispatch(setSuccessMessage(result.message || "Request sent."));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  // Withdraw a pending request (DELETE)
  async function cancelRequest(assignmentId) {
    try {
      dispatch(setSaving(true));
      dispatch(clearMessages());

      const res = await fetch(`${BASE}${ENDPOINTS.requests}/${assignmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not cancel the request.");

      dispatch(removeRequest(assignmentId));
      dispatch(setSuccessMessage("Request cancelled."));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  // End the connection with a doctor (DELETE). The doctor's own records are not touched.
  async function removeAssignment(assignmentId) {
    try {
      dispatch(setSaving(true));
      dispatch(clearMessages());

      const res = await fetch(`${BASE}${ENDPOINTS.doctors}/${assignmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Could not remove the doctor.");

      dispatch(removeDoctor(assignmentId));
      dispatch(setSuccessMessage("Doctor removed from your list."));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Could not connect to the server."));
      return false;
    } finally {
      dispatch(setSaving(false));
    }
  }

  return {
    profile,
    doctors,
    requests,
    loading,
    saving,
    error,
    successMessage,
    reload: loadReceptionistData,
    saveProfile,
    changePhoto,
    searchDoctors,
    sendRequest,
    cancelRequest,
    removeAssignment,
  };
}
