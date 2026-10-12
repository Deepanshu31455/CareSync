// One place for the backend address. Set VITE_API_URL in the frontend .env to change it
// (for example for deployment); it falls back to the local server.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
