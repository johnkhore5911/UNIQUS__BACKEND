const errorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { User } = require("../models/User");
const { JoinRequestModel } = require("../models/JoinRequests");
const bcrypt = require("bcryptjs");
const Classroom = require("../models/Classroom");
const otpGenerator = require("otp-generator");
const OTP = require("../models/OTP");

const jwt = require("jsonwebtoken");
require("dotenv").config();

const register = async (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  const { firstName, lastName, email, userRole, password, otp } = req.body;

  if (!firstName || !lastName) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!userRole) throw new Error("Role is required");
  if (!password) throw new Error("Password is required");
  if (!otp) throw new Error("OTP is required");

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const otpRes = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (!otpRes.length) {
      return res.status(400).json({ success: false, message: "invalid email" });
    }

    if (otp !== otpRes[0].otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const user = await User.create({
      email,
      password,
      userRole,
      firstName,
      lastName,
    });
    // Save the user to the database
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    next(err);
  }
};


const login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log("email: ", email);
  console.log("password: ", password);

  if (!email || !password) {
    return next(new errorResponse("Please provide an email and password", 400));
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    console.log(user);

    if (!user) {
      return next(new errorResponse("Invalid credentials", 401));
    }

    const isMatch = await user.matchPasswords(password);
    if (!isMatch) {
      return res.status(404).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    let classroom = [];
    console.log(user.classroomsArray);

for (const classId of user.classroomsArray) {
  // Populate curriculum structure and the notes inside resources for each chapter
  const classinfo = await Classroom.findById(classId)
    .populate({
      path: 'curriculum_Structure',  // Populate curriculum structure
      populate: [
        {
          path: 'resources.notes',  // Populate notes inside resources for each chapter
        },
        {
          path: 'resources.test',    // Populate tests inside resources for each chapter
        },
        {
          path:'resources.videos'
        }
      ]
    });

  if (classinfo != null) {
    const chapterData = classinfo.curriculum_Structure.map(chapter => {
      // Extracting notes from resources
      const notesData = chapter.resources.notes.map(note => ({
        id: note._id,
        title: note.title,  // Assuming 'title' field in each note
        desc: note.desc,  // Assuming 'desc' field in each note
        filePath:note.filePath
      }));

      const testsData = chapter.resources.test.map(testx => ({
        id: testx._id,
        title: testx.title,  // Assuming 'title' field in each note
        createdAt:testx.createdAt
      }));


      const videoData = chapter.resources.videos.map(video => ({
        id: video._id,
        title: video.title,  // Assuming 'title' field in each note
        desc:video.desc,
        filePath:video.filePath,
        videoType:video.videoType,
        youtubeVideoId:video.youtubeVideoId
        
      }));

      return {
        id: chapter._id,
        title: chapter.chapterTitle,
        resources: {
          notes: notesData,  // Include the populated notes array
          tests: testsData,
          videos: videoData

        }
      };
    });

    // Structure for each classroom
    const classData = {
      classID: classinfo._id,
      title: classinfo.title,
      subject: classinfo.subject,
      members: classinfo.members.length,
      chapters: chapterData // this will include chapter titles and resources
    };

    classroom.push(classData);
  }
}


    if (user.userRole === "student") {
      const pendingRequests = await JoinRequestModel.find({ userId: user._id });
      for (const request of pendingRequests) {
        const { classRoomId, status } = request;
        const classinfo = await Classroom.findById({ _id: classRoomId })
          .populate('curriculum_Structure'); // Populate chapters for pending requests

        if (classinfo != null) {
          const chapterTitles = classinfo.curriculum_Structure.map(chapter => ({
            id: chapter._id,
            title: chapter.chapterTitle // Use chapter.chapterTitle instead of chapter.title
          }));

          const classData = {
            classID: classinfo._id,
            title: classinfo.title,
            subject: classinfo.subject,
            members: null,
            status: status,
            chapters: chapterTitles, // Include chapter titles for pending requests
          };

          classroom.push(classData);
        }
      }
    }

    // Create and Handle JWT Tokens
    const accessToken = jwt.sign({ userId: user.id }, "johnkhore", {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign(
      { userId: user.id },
      "johnkhore",
      { expiresIn: 1800 }
    );

    // Saving refreshToken with current user
    user.refreshToken = refreshToken;
    await user.save();

    console.log("refreshToken: ",refreshToken);
    console.log("user.refreshToken: ",user.refreshToken);

    res.cookie("jwt", refreshToken, {
      sameSite: "None",
      // maxAge: 24 * 60 * 60 * 1000,
      maxAge: 2 * 60 * 1000,
    });

    // User data to be sent
    let userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      userRole: user.userRole,
      name: user.firstName.concat(` ${user.lastName}`),
      joinReqs: user.joinRequests,
      refreshToken: user.refreshToken,
      createdAt: user.createdAt,
    };

    // Sending a success response
    res.json({
      token: accessToken,
      user: userData,
      classArray: classroom,
    });
  } catch (err) {
    next(err);
  }
};







const verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new Error("Email is required");
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
    }
    await OTP.create({ email, otp });
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const forgotpassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new errorResponse("There is no user with that email", 404));
    }
    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `http://localhost:5173/resetpassword/${resetToken}`;
    const message = `<h1>You have requested a password reset</h1>
        <p>Please go to this link to reset your password</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>`;

    try {
      sendEmail({
        to: user.email,
        subject: "Password reset request",
        html: message,
      })
        .then((result) => {
          res.status(200).json({
            success: true,
            message: "Password reset link is sent to your email",
          });
        })
        .catch((error) => {
          return next(new errorResponse("Email could not be sent", 500));
        });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return next(new errorResponse("Email could not be sent", 500));
    }
  } catch (err) {
    next(err);
  }
};

const resetpassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");
  console.log("kya baat hai ?");
  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return next(new errorResponse("Invalid Token", 400));
    }
    user.password = req.body.NewPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(201).json({
      success: true,
      data: "PASSWORD RESET SUCCESSFULLY",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotpassword,
  resetpassword,
  verifyEmail,
};
