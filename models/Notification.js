const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Class id is required"],
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now(),
      expires: 604800, // 1 week in seconds,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = {Notification}