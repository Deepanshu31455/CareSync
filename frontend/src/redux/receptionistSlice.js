import { createSlice } from "@reduxjs/toolkit";

// Everything the Receptionist Profile page shows lives here after it is fetched.
const initialState = {
  profile: null, // personal details: id, fullName, email, phone, ...
  doctors: [], // connected doctors:  { assignmentId, since, doctor: {...} }
  requests: [], // waiting for the doctor: { assignmentId, requestedAt, expiresAt, expired, doctor: {...} }
  loading: true, // true until the first fetch finishes (avoids a "not found" flash)
  saving: false, // true while saving, sending or removing
  error: null,
  successMessage: null,
};

const receptionistSlice = createSlice({
  name: "receptionist",
  initialState,

  reducers: {
    // Store everything received from the backend in one go
    setReceptionistData: (state, action) => {
      const { profile, doctors, requests } = action.payload;
      state.profile = profile;
      state.doctors = doctors;
      state.requests = requests;
    },

    // Replace the personal details (after the profile is saved)
    setProfile: (state, action) => {
      state.profile = action.payload;
    },

    // Change only some personal fields, e.g. { profilePhoto: "https://..." }
    patchProfile: (state, action) => {
      if (state.profile) state.profile = { ...state.profile, ...action.payload };
    },

    // A new request was sent
    addRequest: (state, action) => {
      state.requests.unshift(action.payload);
    },

    // A request was cancelled
    removeRequest: (state, action) => {
      state.requests = state.requests.filter((r) => r.assignmentId !== action.payload);
    },

    // A doctor was removed (action.payload = assignmentId)
    removeDoctor: (state, action) => {
      state.doctors = state.doctors.filter((d) => d.assignmentId !== action.payload);
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSaving: (state, action) => {
      state.saving = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
});

export const {
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
} = receptionistSlice.actions;

export default receptionistSlice.reducer;
