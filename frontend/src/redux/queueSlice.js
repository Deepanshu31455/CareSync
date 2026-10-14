import { createSlice } from "@reduxjs/toolkit";

// The live queue of ONE doctor on ONE day: the screen that is open right now.
//   items       the full queue (doctor / receptionist screens): [{ appointmentId, tokenNumber, status, ... }]
//   nowServing  the token being served; waiting = how many are still waiting (patients' panel)
//   seq         number of the last live message applied (used to spot a missed message)
//   connection  "connecting" | "live" | "offline"
const initialState = {
  doctorId: null,
  date: null,
  items: [],
  nowServing: null,
  waiting: 0,
  seq: null,
  connection: "connecting",
  loading: true,
  error: null,
};

const byToken = (a, b) => a.tokenNumber - b.tokenNumber;

const queueSlice = createSlice({
  name: "queue",
  initialState,

  reducers: {
    // A queue screen opened: start from empty
    queueOpened: (state, action) => ({ ...initialState, ...action.payload }),

    // The full picture from the server (first load, after a reconnect, after a missed message)
    snapshotLoaded: (state, action) => {
      const { items = [], nowServing = null, waiting = 0, seq = 0 } = action.payload;
      state.items = [...items].sort(byToken);
      state.nowServing = nowServing;
      state.waiting = waiting;
      state.seq = seq;
      state.loading = false;
      state.error = null;
    },

    // One live change to the queue
    //   { type: "upsert", item }  adds or replaces one row
    //   { type: "remove", appointmentId }
    // optional: nowServing, waiting
    changeApplied: (state, action) => {
      const { type, item, appointmentId, nowServing, waiting, seq } = action.payload;

      if (type === "upsert" && item) {
        const index = state.items.findIndex((i) => i.appointmentId === item.appointmentId);
        if (index === -1) state.items.push(item);
        else state.items[index] = { ...state.items[index], ...item };
        state.items.sort(byToken);
      }
      if (type === "remove") {
        state.items = state.items.filter((i) => i.appointmentId !== appointmentId);
      }
      if (nowServing !== undefined) state.nowServing = nowServing;
      if (waiting !== undefined) state.waiting = waiting;
      state.seq = seq;
    },

    // The public summary for patients: { token, waiting, seq }
    nowServingChanged: (state, action) => {
      state.nowServing = action.payload.token ?? null;
      state.waiting = action.payload.waiting ?? 0;
      state.seq = action.payload.seq;
    },

    setConnection: (state, action) => {
      state.connection = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    queueClosed: () => initialState,
  },
});

export const {
  queueOpened,
  snapshotLoaded,
  changeApplied,
  nowServingChanged,
  setConnection,
  setError,
  queueClosed,
} = queueSlice.actions;

export default queueSlice.reducer;
