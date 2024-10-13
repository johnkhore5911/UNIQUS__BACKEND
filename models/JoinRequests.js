const mongoose = require("mongoose");

const JoinRequestSchema = new mongoose.Schema(
  {
    classRoomId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Classroom Id is required."],
      ref: "Classroom",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: [true, "User Id is required"],
      ref: "User",
    },
    status: {
      type: String,
      enum: ["accepted", "pending", "declined", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const JoinRequestModel = mongoose.model("joinrequest", JoinRequestSchema);

module.exports = {
  JoinRequestModel,
};
