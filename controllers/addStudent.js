const { User } = require("../models/User");
const Classroom = require("../models/Classroom");
const { JoinRequestModel } = require("../models/JoinRequests");
require("dotenv").config({ path: "./config.env" });

// generates link to join classroom
const generateLinkforJoiningClass = (req, res, next) => {
  try {
    const userRole = req.user.userRole;
    if (userRole == "teacher") {
      const classId = req.params.classId;
      const link = `https://${process.env.FRONTEND_DOMAIN}/home/${classId}`;
      res.status(200).json({ link: link });
    } else {
      res
        .status(401)
        .json({ message: "You are not authorized to perform this action" });   
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// adds new entry in joinrequests collection
const joinClassroom = async (req, res, next) => {
  try {
    const userId = req.user.userID;
    const userRole = req.user.userRole;
    const classId = req.params.classId;

    // verifying user role
    if (userRole !== "student")
      throw new Error(`Only Student can make join requests.`);

    // verifying the join request
    const joinReqs = await JoinRequestModel.find({
      classRoomId: classId,
      userId,
    });
    if (joinReqs && joinReqs.length > 0)
      throw new Error(`Status ${joinReqs[0].status}`);

    // creating join request
    const newJoinRequest = new JoinRequestModel({
      classRoomId: classId,
      userId,
    });
    await newJoinRequest.save();

    // saving the references to classroom and user
    await Classroom.updateOne(
      { _id: classId },
      {
        $push: { joinRequests: newJoinRequest._id },
      }
    );
    await User.updateOne(
      { _id: userId },
      {
        $push: { joinRequests: newJoinRequest._id },
      }
    );

    res.json({ success: true, message: "Join Classroom Request Sent." });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

// to show the teacher all the requests
const getAllJoinRequests = async (req, res, next) => {
  try {
    const userRole = req.user.userRole;
    const userId = req.user.userID;

    // getting all the requests
    if (userRole === "student")
      throw new Error(`Only teacher can get join requests`);

    // finding classes
    const allClassrooms = await Classroom.find({ createdBy: userId });
    if (!allClassrooms || allClassrooms.length === 0)
      throw new Error(`No classrooms found for ${userId} id.`);

    // creating classroom data
    const classes = allClassrooms.map((classroom) => classroom.title);

    // fetching all the requests
    const joinReqs = [];
    await Promise.all(
      allClassrooms.map(async (_class) => {
        const joinRequests = await JoinRequestModel.find({
          classRoomId: _class._id,
        })
          .populate({
            path: "classRoomId",
            select: "title subject standard createdAt",
          })
          .populate({
            path: "userId",
            select: "_id firstName lastName email",
          });
        joinReqs.push(...joinRequests);
      })
    );

    res.json({
      success: true,
      message: "Join requests sent.",
      joinReqs,
      classes,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

// teacher will accept, decline, block students requests
const handlejoinrequest = async (req, res, next) => {
  try {
    const classId = req.params.classId;
    const userRole = req.user.userRole;
    const studentId = req.body.studentId;
    const status = req.body.status;

    // verify user role
    if (userRole !== "teacher")
      throw new Error(`Only teachers can handle join requests`);

    // verify in other documents
    const classinfo = await Classroom.findOne({ _id: classId });
    const userinfo = await User.findOne({ _id: studentId });
    if (!classinfo || !userinfo)
      throw new Error(`Error while getting details.`);
    if (
      classinfo.members.includes(studentId) &&
      userinfo.classroomsArray.includes(classId)
    )
      throw new Error(`Already a member.`);

    // finding join request
    const joinReq = await JoinRequestModel.findOne({
      classRoomId: classId,
      userId: studentId,
    });
    if (!joinReq) throw new Error(`No such join request found.`);

    // un-block student
    if (status === "unblock" && joinReq.status === "blocked") {
      await JoinRequestModel.updateOne(
        { _id: joinReq._id },
        { $set: { status: "pending" } }
      );
    } else {
      // verify current status
      if (joinReq.status !== "pending")
        throw new Error(`Join request is not pending.`);

      // checking status
      if (status === "accept") {
        // delete the request
        await JoinRequestModel.deleteOne({ _id: joinReq._id });
        // add to members array
        await Classroom.updateOne(
          { _id: classId },
          {
            $push: { members: { id: studentId } },
            $pull: { joinRequests: joinReq._id },
          }
        );
        // add to classrooms array
        await User.updateOne(
          { _id: studentId },
          {
            $push: { classroomsArray: classId },
            $pull: { joinRequests: joinReq._id },
          }
        );
      } else if (status === "decline") {
        await JoinRequestModel.updateOne(
          { _id: joinReq._id },
          { $set: { status: "declined" } }
        );
      } else if (status === "block") {
        await JoinRequestModel.updateOne(
          { _id: joinReq._id },
          { $set: { status: "blocked" } }
        );
      }
    }

    res.json({ success: true, message: `Request updated | ${status}ed.` });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

// sends class info to student
const getclasstojoin = async (req, res, next) => {
  try {
    const classId = req.params.classId;

    // getting class info
    const classInfo = await Classroom.findById(classId).populate("createdBy");
    if (!classInfo) throw new Error(`No class room info found for ${classId}`);

    console.log({ classInfo });

    res.json({
      success: true,
      message: "Class info sent successfully",
      classInfo: {
        title: classInfo.title,
        subject: classInfo.subject,
        standard: classInfo.standard,
        teacherName: classInfo.createdBy.firstName + " " + classInfo.createdBy.lastName,
        teacherId: classInfo.createdBy._id,
      },
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// TODO
const LeaveClassroom = async (req, res, next) => {
  const classId = req.params.classId;
  const userID = req.user.userID;
  const userRole = req.user.userRole;

  if (userRole === "teacher") {
    res
      .status(401)
      .json({ message: "You are not authorized to perform this action" });
  } else if (userRole === "student") {
    let classArray = [];
    let membersArray = [];
    try {
      const classtoLeave = await Classroom.findById(classId);
      const usertoExit = await User.findById(userID);
      classArray = usertoExit.classroomsArray;
      membersArray = classtoLeave.members;
      const memberToDelete = membersArray.findIndex(
        (member) => member.id.toString() === userID
      );
      const classToDelete = classArray.findIndex(
        (classroom) => classroom._id.toString() === classId
      );
      if (memberToDelete !== -1 && classToDelete !== -1) {
        membersArray.splice(memberToDelete, 1);
        classArray.splice(classToDelete, 1);
        try {
          await classtoLeave.save();
          await usertoExit.save();
          res.status(200).json({ message: "Successfully left the classroom" });
        } catch (err) {
          console.log("error while saving changes", err);
          res.status(500).json({ message: "Internal server error, try later" });
          next(err);
        }
      } else {
        res.status(200).json({ message: "Not a member of this classroom" });
      }
    } catch (err) {
      console.log("error while fetching user or classroom to leave", err);
      res.status(404).json({ error: err });
      next(err);
    }
  }
};

// TODO
const RemoveStudentfromClassroom = async (req, res, next) => {
  const classId = req.params.classId;
  const Email = req.params.email;
  const userRole = req.user.userRole;

  if (userRole !== "teacher") {
    res
      .status(401)
      .json({ message: "You are not authorized to perform this action" });
  } else if (userRole === "teacher") {
    let classArray = [];
    let membersArray = [];
    try {
      const classtoLeave = await Classroom.findById(classId);
      const usertoExit = await User.findOne({ email: Email });
      classArray = usertoExit.classroomsArray;
      membersArray = classtoLeave.members;
      const memberToDelete = membersArray.findIndex(
        (member) => member.id.toString() === usertoExit._id.toString()
      );
      const classToDelete = classArray.findIndex(
        (classroom) => classroom._id.toString() === classId
      );
      if (memberToDelete !== -1 && classToDelete !== -1) {
        membersArray.splice(memberToDelete, 1);
        classArray.splice(classToDelete, 1);
        try {
          await classtoLeave.save();
          await usertoExit.save();
          res.status(200).json({
            message:
              "Successfully removed " +
              usertoExit.firstName +
              usertoExit.lastName +
              " from classroom",
          });
        } catch (err) {
          console.log("error while saving changes", err);
          res.status(500).json({ message: "Internal server error, try later" });
          next(err);
        }
      } else {
        res.status(200).json({ message: "Not a member of this classroom" });
      }
    } catch (err) {
      console.log("error while fetching user or classroom to leave", err);
      res.status(404).json({ error: err });
      next(err);
    }
  }
};

module.exports = {
  generateLinkforJoiningClass,
  joinClassroom,
  handlejoinrequest,
  getclasstojoin,
  getAllJoinRequests,
  LeaveClassroom,
  RemoveStudentfromClassroom,
};
