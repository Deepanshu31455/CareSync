const express=require('express');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose=require('mongoose');


const app=express();

require("dotenv").config();
const PORT=process.env.PORT ||3000;


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));


app.use(express.json());
app.use(cookieParser());
// const fileUpload=require("express-fileupload")
// app.use(fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/"
// }));


const connectwithdb=require("./config/database");
connectwithdb();

// const cloud=require("./config/cloudinary");
// cloud.cloudinaryConnect();


const Route=require("./routes/route")
app.use("/api/v1",Route);


app.listen(PORT,()=>{
      console.log(`Server Started at port ${PORT}`);
})


app.get("/",(req,res)=>
{
      res.send(`<h1>This is homepage </h1>`)
})