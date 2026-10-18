// Set VITE_API_URL to the deployed backend API URL.
// Automatically appends /api/v1 if omitted in deployment configuration.
const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1").replace(/\/+$/, "");
export const API_BASE = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;
