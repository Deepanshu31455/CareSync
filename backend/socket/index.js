const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const { roomName } = require("./access");
const { access } = require("./identity");

const MAX_ROOMS_PER_SOCKET = 8; // stops one browser from joining unlimited rooms

// Reads one cookie value out of the raw "Cookie" header
function readCookie(header = "", name) {
  const part = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

// Starts Socket.IO on the given HTTP server.
//   server = http.createServer(app)     app = the Express app     clientUrl = the React app's address
function initSocket(server, app, clientUrl) {
  const io = new Server(server, {
    cors: { origin: clientUrl, credentials: true },
  });

  // Controllers reach it with req.app.get("io")
  app.set("io", io);

  // 1. Who is connecting? The browser sends the same login cookie as for normal requests.
  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, "token");
      if (!token) return next(new Error("Not authenticated"));

      const user = jwt.verify(token, process.env.JWT_SECRET); // { accountId, role }
      const userId = await access.resolveUserId(user.role, user.accountId);
      if (!userId) return next(new Error("Account not found"));

      socket.data.user = user;
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error("Session expired"));
    }
  });

  io.on("connection", (socket) => {
    // A private room for messages meant only for this person
    socket.join(roomName.user(socket.data.userId));

    // 2. Join a live room. The browser asks, the server decides.
    //    request = { kind: "queue" | "now", doctorId (6-digit ID), date }     ack = ({ ok, doctorId, message }) => ...
    socket.on("queue:join", async (request, ack) => {
      try {
        if (socket.rooms.size >= MAX_ROOMS_PER_SOCKET) {
          return reply(ack, { ok: false, message: "Too many open queues." });
        }

        const result = await access.canJoin(socket.data.user, request);
        if (!result.ok) return reply(ack, result);

        await socket.join(result.room);
        // Receptionists also join the desk room: the same changes, but with phone numbers
        if (result.role === "receptionist") await socket.join(roomName.desk(result.doctorId, result.date));
        return reply(ack, { ok: true, doctorId: result.doctorId });
      } catch (err) {
        console.log("queue:join failed:", err.message);
        return reply(ack, { ok: false, message: "Could not join the queue." });
      }
    });

    socket.on("queue:leave", async (request) => {
      const { kind, doctorId: ref, date } = request || {};
      if (kind !== "queue" && kind !== "now") return;
      const doctorId = await access.resolveDoctorId(ref);
      if (!doctorId) return;
      socket.leave(roomName[kind](doctorId, date));
      if (kind === "queue") socket.leave(roomName.desk(doctorId, date));
    });
  });

  return io;
}

// The reply function is optional on the browser side
function reply(ack, payload) {
  if (typeof ack === "function") ack(payload);
}

module.exports = { initSocket };
