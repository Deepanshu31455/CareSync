import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authslice";
import doctorReducer from "./doctorSlice";
import patientReducer from "./patientSlice";
import receptionistReducer from "./receptionistSlice";

export const store = configureStore({
  reducer: {
    authStore: authReducer, // logged-in user identity (id, name, role, email)
    doctor: doctorReducer, // full doctor profile document + loading/saving states
    patient: patientReducer, // patient profile, consultations, prescriptions, reports, bills
    receptionist: receptionistReducer, // receptionist profile, serving doctors, pending requests
  },
});
