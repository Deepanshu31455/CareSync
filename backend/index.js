const express=require('express');
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose=require('mongoose');


const app=express();
const fileUpload=require("express-fileupload")
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}));



require("dotenv").config();
const PORT=process.env.PORT ||3000;

// Where the React app runs. Used for CORS here, for the Socket.IO connection,
// and for the links inside emails. Set CLIENT_URL in .env when you deploy.
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));


app.use(express.json());
app.use(cookieParser());


const connectwithdb=require("./config/database");
connectwithdb();

const cloud=require("./config/cloudinary");
cloud.cloudinaryConnect();


const Route=require("./routes/route")
app.use("/api/v1",Route);


app.get("/",(req,res)=>
{
      res.send(`<h1>This is homepage </h1>`)
})


// Socket.IO needs the plain Node server underneath Express, so the app is wrapped
// in http.createServer and that server (not app) is the one that listens.
const server = http.createServer(app);
const { initSocket } = require("./socket");
initSocket(server, app, CLIENT_URL); // also makes the io object available as req.app.get("io")

server.listen(PORT,()=>{
      console.log(`Server Started at port ${PORT}`);
})
