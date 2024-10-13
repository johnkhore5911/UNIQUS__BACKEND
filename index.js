
// require("dotenv").config({ path: "./config.env" });
require('dotenv').config();

const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
// const corsOptions = require("./config/corsOptions");
const route = require("./routes/auth");
const home = require("./routes/home");
const refreshToken = require("./routes/refreshToken");
// const PORT = process.env.PORT || 5001;
//i will change it later on
const PORT= 4000;
// const connectDB = require("./config/db");
// const errorHandler = require("./middleware/error");
const cookieparser = require("cookie-parser");
const bodyParser = require("body-parser");
const protect = require("./middleware/auth");
// const credentials = require("./middleware/credentials");
const socketIO = require("socket.io");
// const {
//   saveNotifications,
//   markIsRead,
// } = require("./controllers/notifications");
// Connect to database

const mongoose = require('mongoose');
const connectDB = async () => {
    try {
      const conn = await mongoose.connect("mongodb+srv://anshul:anshul@cluster0.qpwuyws.mongodb.net/?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    //   console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("MongoDB coonected Successfully")
    //   console.log(`MONGO_URI: ${process.env.MONGO_URI}`);
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1); // Exit the process with failure
    }
  };
  connectDB();

// // Handle options credentials check - before CORS!
// // and fetch cookies credentials requirement
// app.use(credentials);

// app.use(cors(corsOptions));

app.use(bodyParser.json());

// // for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieparser());
app.use(express.json());
app.use(express.static("uploads"));

app.use("/api/auth", route);
app.use("/refresh", refreshToken);
app.use("/logout", require("./routes/logout"));
app.use("/subscription", require("./routes/subscription"));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// //Auth middleware to check the AccessToken
app.use("/home",protect, home);

// // ---- Deployment
// const __dirname1 = path.resolve()
// if(process.env.NODE_ENV === "PRODUCTION"){
//  app.use(express.static(path.join(__dirname1,"/client/Classroom/dist")))
//  app.get('*',(req,res)=> {
//   res.sendFile(path.resolve(__dirname1,"client","Classroom","dist","index.html"))
//  })
// }
// // ---- Deployment

// app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
// const io = new socketIO.Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });
// //socket io connection
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   socket.on("assignment-posted", async (classid) => {
//     io.in(classid).emit("assignment-notification", {
//       classId: classid,
//       message: "Assignment posted successfully",
//     });

//     await saveNotifications(classid, "New assignment posted in");
//   });

//   socket.on("notes-posted", async (classid) => {
//     io.in(classid).emit("notes-notification", {
//       classId: classid,
//       message: "notes posted successfully",
//     });

//     await saveNotifications(classid, "New notes posted in");
//   });

//   socket.on("test-posted", async (classid) => {
//     io.in(classid).emit("test-notification", {
//       classId: classid,
//       message: "test posted successfully",
//     });

//     await saveNotifications(classid, "New test posted in");
//   });

//   socket.on("video-posted", async (classid) => {
//     io.in(classid).emit("video-notification", {
//       classId: classid,
//       message: "video uploaded successfully",
//     });

//     await saveNotifications(classid, "New video lecture posted in");
//   });

//   // Listen for a teacher posting an announcement
//   socket.on("postAnnouncement", ({ classID, announcement, className }) => {
//     // Broadcast the announcement to all students in the classroom
//     io.in(classID).emit("newAnnouncement", {
//       classID: classID,
//       announcement: announcement.message,
//       className,
//     });
//   });

//   // Join a classroom room when a student connects
//   socket.on("joinRoom", (classroomID) => {
//     console.log("user joined a room");
//     socket.join(classroomID);
//   });
//   // effiency---
//   socket.on("effiencyCalculationDone", ({ classID }) => {
//     console.log("Specific task is done:", classID);
//     // Send a message to the client
//     io.in(classID).emit("taskCompletedMessage", {
//       message: "Your task is completed",
//     });
//   });

//   socket.on(
//     "read-notification",
//     async (notificationId) => await markIsRead(notificationId)
//   );

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// process.on("unhandledRejection", (err, promise) => {
//   console.log(`Logged Error: ${err}`);
//   server.close(() => process.exit(1));
// });


app.get('/', (req, res)=>{
  res.json('HELLO WORLD')
})