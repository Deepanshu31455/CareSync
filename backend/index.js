const express=require('express');
const cors = require("cors");

const app=express();

app.use(cors({
  origin: "http://localhost:5173"
}));


require("dotenv").config();
const PORT=process.env.PORT ||3000;

app.use(express.json());
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