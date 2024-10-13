// const mongoose = require("mongoose");
// // require("dotenv").config({ path: "../config.env" });
// require('dotenv').config();

// const connectDB = async () => {
//   const conn = await mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });
//   console.log(
//     `MongoDB Connected: ${conn.connection.host}\n${process.env.MONGO_URI}`
//   );
//   console.log("PROCEESS.ENV", process.env);
// };

// module.exports = connectDB;


const mongoose = require('mongoose');
// require('dotenv').config(); // Load environment variables from .env file
require('dotenv').config({ path: '.././config.env' }); // Adjust the path as needed

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MONGO_URI: ${process.env.MONGO_URI}`);
    console.log("Process Environment Variables:", process.env); // Log all environment variables for debugging
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
