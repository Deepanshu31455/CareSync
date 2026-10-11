import { createSlice } from "@reduxjs/toolkit";

// Everything the Patient Profile page shows lives here after it is fetched.
const initialState = {
  profile: null, // personal details: id, fullName, email, phone, dob, ...
  consultations: [], // previous visits (read-only for the patient)
  prescriptions: [], // uploaded prescriptions
  reports: [], // uploaded test reports
  bills: [], // uploaded / stored bills
  loading: true, // true until the first fetch finishes (avoids a "not found" flash)
  saving: false, // true while saving, uploading or deleting
  error: null, // error message if something fails
  successMessage: null, // message after a successful action
};

const patientSlice = createSlice({
  name: "patient",
  initialState,

  reducers: {
    // Store everything received from the backend in one go
    setPatientData: (state, action) => {
      const { profile, consultations, prescriptions, reports, bills } = action.payload;
      state.profile = profile;
      state.consultations = consultations;
      state.prescriptions = prescriptions;
      state.reports = reports;
      state.bills = bills;
    },

    // Replace the personal details (after the profile is saved)
    setProfile: (state, action) => {
      state.profile = action.payload;
    },

    // Change only some personal fields, e.g. { profilePhoto: "https://..." }
    patchProfile: (state, action) => {
      if (state.profile) state.profile = { ...state.profile, ...action.payload };
    },

    // Add one uploaded item. kind = "prescriptions" | "reports" | "bills"
    addItem: (state, action) => {
      const { kind, item } = action.payload;
      state[kind].unshift(item);
    },

    // Remove one item by its _id. kind = "prescriptions" | "reports" | "bills"
    removeItem: (state, action) => {
      const { kind, id } = action.payload;
      state[kind] = state[kind].filter((item) => item._id !== id);
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

    // Wipe everything, e.g. when the patient logs out
    clearPatientData: () => initialState,
  },
});

export const {
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
  clearPatientData,
} = patientSlice.actions;

export default patientSlice.reducer;
