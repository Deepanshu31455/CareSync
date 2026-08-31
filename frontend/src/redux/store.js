import { configureStore, createSlice } from '@reduxjs/toolkit'
import authReducer from '../redux/authslice'

export const store = configureStore({
  reducer: {
    authStore: authReducer,
  },
})