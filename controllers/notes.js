const Chapter = require("../models/Chapters");
const Classroom = require("../models/Classroom");
const Note = require("../models/Note");
const path = require("path");

// Handle file upload
const uploadFile = async (req, res) => {
  const classId = req.params.classid;  
  const chapterId = req.params.chapterid;
  const { userID, userRole } = req.user;
  const { title, desc } = req.body;

  console.log(classId, chapterId, title, desc)

  if (!req.file) {
    return res
      .status(400)
      .json({ error: "Invalid file format or size too large" });
  }

  try {
    const class_room = await Classroom.findById(classId);
    if (!class_room) {
      return res.status(404).json({ error: "Classroom not found" });  
    }
    if (userRole !== "teacher") {
      return res.status(403).json({ error: "Only teachers can add notes." });  
    }

    const selectedChapter = await Chapter.findById(chapterId);
    if(!selectedChapter) {
      res.status(404).json({message: "chapter not found"});
    }

    if(selectedChapter.isLocked == true) {
      res.status(405).json({message: "action not allowed"})      
    }
    const sendFile = {  
      title: title,
      createdBy: userID,
      filePath: req.file.path,
      originalname: req.file.originalname,
      filename: req.file.filename,
    };
    if (desc) {
      sendFile.desc = desc;
    }
    const file = await Note.create(sendFile);
    await file.save();

    selectedChapter.resources.notes.push(file.id);
    await selectedChapter.save();

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Error uploading file.");
  }
};

// File Data set
// const fileData = async (req, res) => {
//   try {
//     const classId = req.params.classid;
//     // console.log({ classId });
//     // Check if the classroom exists
//     const classRoom = await Classroom.findById({ _id: classId });
//     // console.log({ classRoom });
//     if (!classRoom) {
//       return res.status(404).json({ error: "Classroom not found" });
//     }

//     const curriculum_Structure = classRoom.curriculum_Structure;
//     for (const chapterID of curriculum_Structure) {
//       let noteIds = [];
//       let resources = {}
//       if (chapterID) {
//         const chapter = await Chapter.findById(chapterID.toString());
//         if (chapter.isLocked == false) {
//           noteIds = chapter.resources.notes.map((note) => note._id);
//           if (noteIds.length > 0) {
//             try {
//               // Fetch files corresponding to note ids
//               const files = await Note.find({ _id: { $in: noteIds } });
//               if(files.length > 0) {

//               }
//             } catch(err) {
//               console.log(err)
//             }
            
//           }
//         }
//       }
//     }

//     // Set response content type
//     res.setHeader("Content-Type", "application/pdf");

//     // Send files as JSON response
//     res.json(files);
//   } catch (error) {
//     console.error("Error fetching files:", error);
//     res.status(500).json({ error: "Error fetching files" });
//   }
// };

// Handle file download
const downloadFile = async (req, res) => {
  const filename = req.params.filename;
  // console.log(filename);
  const filePath = path.join(__dirname, '../uploads/notes', filename);

  // console.log(filePath);
  res.setHeader("Content-Type", "application/pdf");

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("File not found");
    }
  });
};

module.exports = {
  uploadFile,
  downloadFile,
  // fileData,
};
