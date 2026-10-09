import { configureStore } from "@reduxjs/toolkit";
import authReducer   from "./authslice";
import doctorReducer from "./doctorSlice";

export const store = configureStore({
  reducer: {
    authStore: authReducer,    // logged-in user identity (id, name, role, email)
    doctor:    doctorReducer,  // full doctor profile document + loading/saving states
  },
});