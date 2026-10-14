import { io } from "socket.io-client";
import { API_BASE } from "./config";

// ONE shared connection for the whole app.
// - withCredentials sends the login cookie, which is how the server knows who you are.
// - autoConnect is off: the connection opens only when a live screen asks for it (useQueue).
// The server address is the API address without "/api/v1".
export const socket = io(API_BASE.replace(/\/api\/v1\/?$/, ""), {
  withCredentials: true,
  autoConnect: false,
});

// Call this when the user logs out, so the old login's connection does not stay open.
export function disconnectSocket() {
  if (socket.connected || socket.active) socket.disconnect();
}
