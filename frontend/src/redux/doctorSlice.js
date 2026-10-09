
import { createSlice } from "@reduxjs/toolkit";

// Initial state for the doctor profile
const initialState = {
  data: null,           // Full doctor profile from MongoDB
  loading: false,       // True while fetching the profile
  saving: false,        // True while updating the profile
  error: null,          // Error message if something fails
  successMessage: null, // Message after a successful update
};

const doctorSlice = createSlice({
  name: "doctor",
  initialState,

  reducers: {
    // Store the doctor profile received from the backend
    setDoctorData: (state, action) => {
      state.data = action.payload;
    },

    // Set profile-fetching status
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set profile-updating status
    setSaving: (state, action) => {
      state.saving = action.payload;
    },

    // Store an error message
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Store a success message
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },

    // Clear previous error and success messages
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    // Clear doctor data, for example, when the doctor logs out
    clearDoctorData: () => {
      return initialState;
    },

    // Update specific fields in Redux without making an API request
    patchDoctorData: (state, action) => {
      if (state.data) {
        state.data = {
          ...state.data,
          ...action.payload,
        };
      }
    },
  },
});

// Export actions so React components can use them
export const {
  setDoctorData,
  setLoading,
  setSaving,
  setError,
  setSuccessMessage,
  clearMessages,
  clearDoctorData,
  patchDoctorData,
} = doctorSlice.actions;

// Export reducer so store.js can register it
export default doctorSlice.reducer;
