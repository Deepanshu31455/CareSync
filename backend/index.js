const express=require('express');
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose=require('mongoose');
const os = require("os");


const app=express();
const fileUpload=require("express-fileupload")
require("dotenv").config();
const PORT=process.env.PORT ||4000;

// Where the React app runs. Used for CORS here, for the Socket.IO connection,
// and for the links inside emails. Set CLIENT_URL in .env when you deploy.
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}));

app.use(express.json());
app.use(cookieParser());


const connectwithdb=require("./config/database");

const cloud=require("./config/cloudinary");
cloud.cloudinaryConnect();


const Route=require("./routes/route")
app.use("/api/v1",Route);




// Socket.IO needs the plain Node server underneath Express, so the app is wrapped
// in http.createServer and that server (not app) is the one that listens.
const server = http.createServer(app);
const { initSocket } = require("./socket");
initSocket(server, app, CLIENT_URL); // also makes the io object available as req.app.get("io")

// Await the DB connection before accepting any traffic.
// This prevents buffering timeouts on early requests during startup.
async function startServer() {
  await connectwithdb();
  server.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

