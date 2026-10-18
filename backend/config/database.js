const mongoose = require("mongoose");

require("dotenv").config();


const connectwithdb = () => {
    return mongoose.connect(process.env.MONGODB_URL)
        .then(() => {
            console.log("DB connected successfully");
        })
        .catch((error) => {
            console.log("DB facing connection issue");
            console.log(error);
            process.exit(1);
        });
};

module.exports = connectwithdb;