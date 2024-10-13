const Class = require("../models/Classroom");
const { User } = require("../models/User");
const Classroom = require("../models/Classroom");
const { JoinRequestModel } = require("../models/JoinRequests");
const formatDateTime = require("../utils/formatDateTime");
const jwt = require("jsonwebtoken");


const fetchAllClassMetaData = async (req, res, next) => {
    const userID = req.user.userID;
    const userRole = req.user.userRole;

    if(userRole !== "teacher") {
        res.status(404).json({message: "Not Authorized to access"})
    }

    let classData = [];

    const user = await User.findById(userID)   

    if (!user) {
        res.status(404).json({message: "User not found"})
    }

    const classArray = user.classroomsArray;

    // console.log(classArray)

    for (const i in classArray) {

        const classID = classArray[i].toString();   
        const fetchedClass = await Class.findById(classID)

        // console.log(fetchedClass)
        // console.log(userID)
        // console.log(fetchedClass.createdBy)

        if (fetchedClass) {
            const createdBy = (fetchedClass.createdBy).toString();
           if(createdBy === userID) {
                const classMetaData = {
                    classID: fetchedClass._id,
                    title: fetchedClass.title,
                }
        
                classData.push(classMetaData)
            }
        }
    }
    
    // console.log(classData)
    res.status(200).json({classData})

}


const fetchStudentList = async (req, res, next) => {

    const classID = req.params.classid;
    const userRole = req.user.userRole;

    if (userRole !== "teacher") {
        res.status(404).json({message: "Not authorized to access"})
    }

    const fetchedClass = await Class.findById(classID)

    if (!fetchedClass) {
        res.status(404).json({message: "Classroom not found"})
    }

    const studentList = fetchedClass.members;
    const studentsArray = []

    for (const i in studentList) {
        const userid = studentList[i].id;
        const joinedAt = studentList[i].joinedAt;

        const formattedJoined = formatDateTime(joinedAt)

        const student = await User.findById(userid)

        const studentData = {
            userID: student._id,
            fname: student.firstName,
            lname: student.lastName,
            email: student.email,
            joinedAt: formattedJoined.date
        }

        studentsArray.push(studentData)
    }

    res.status(200).json({studentsArray})
}

const fetchStudentProfile = async (req, res, next) => {
    const Email = req.params.email;
    const userRole = req.user.userRole;

    if (userRole !== "teacher") {
        res.status(401).json({message: "You are not authorized to take this action"})
    }
    try {
        const user = await User.findOne({ email: Email });
        if(!user) {
            res.status(404).json({message: "Student not found"});
        }
        let userData = {}
        userData = {
            name: user.firstName + " " + user.lastName,
            email: user.email,
            userRole: user.userRole,
        }
        res.status(200).json({userData: userData});
    } catch(err) {
        console.log("error while fetching user: ", err)
        res.status(500).json({message: "Internal server error"});
        next(err)
    }
}


//Tum muje token do ma tuje User Data tuga
const UserData = async (req, res, next) => {
    console.log("Passed the authentication!");
    const {userID} = req.user;
    console.log("UserId: ",userID);
  
    try {
      const user = await User.findById( userID );
      
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
  
  
        return {
          id: chapter._id,
          title: chapter.chapterTitle,
          resources: {
            notes: notesData,  // Include the populated notes array
            tests: testsData,
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
        expiresIn: "30m",
      });
      const refreshToken = jwt.sign(
        { userId: user.id },
        "johnkhore",
        { expiresIn: "1d" }
      );
  
      // Saving refreshToken with current user
      user.refreshToken = refreshToken;
      await user.save();
  
      res.cookie("jwt", refreshToken, {
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
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
      console.log("Error aa gya");
    }
  };

module.exports = {
    fetchAllClassMetaData,
    fetchStudentList,
    fetchStudentProfile,
    UserData
}