const Video = require('../models/Video');
const Classroom = require('../models/Classroom');
const Chapter = require("../models/Chapters");

const uploadVideo = async (req, res) => {
  const classId = req.params.classid;
  const chapterId = req.params.chapterid;
  const { userID, userRole } = req.user;
  const { title, desc, videoType, youtubeVideoId } = req.body;

  // for a simple video uploading
  if (videoType === 'upload') {
    if (!req.file) {
      return res.status(400).json({ error: 'Invalid file format or size too large' });
    }
    try {
      const class_room = await Classroom.findById(classId);
      if (!class_room) {
        return res.status(404).json({ error: "Classroom not found" });
      }
      if (userRole !== "teacher") {
        return res
          .status(403)
          .json({ error: "Only teachers can add notes." });
      }

      const selectedChapter = await Chapter.findById(chapterId);
      if (!selectedChapter) {
        res.status(404).json({ message: "chapter not found" });
      }

      if (selectedChapter.isLocked == true) {
        res.status(405).json({ message: "action not allowed" })
      }
      const sendFile = {
        title: title,
        createdBy: userID,
        videoType: videoType,
        filePath: req.file.path,
        filename: req.file.filename
      }
      if (desc) {
        sendFile.desc = desc;
      }
      const file = await Video.create(sendFile);
      await file.save();

      selectedChapter.resources.videos.push(file.id);
      await selectedChapter.save();

      res.status(200).json({
        success: true,
        data: file,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).send('Error uploading file.');
    }
  }
  // if the Teacher provide the youtube link
  else if (videoType === 'youtube') {
    if (!youtubeVideoId) {
      return res.status(400).json({ message: 'Invalid YouTube link.' });
    }
    try {
      const class_room = await Classroom.findById(classId);
      if (!class_room) {
        return res.status(404).json({ error: "Classroom not found" });
      }
      if (userRole !== "teacher") {
        return res
          .status(403)
          .json({ error: "Only teachers can add notes." });
      }

      const selectedChapter = await Chapter.findById(chapterId);
      if (!selectedChapter) {
        res.status(404).json({ message: "chapter not found" });
      }

      if (selectedChapter.isLocked == true) {
        res.status(405).json({ message: "action not allowed" })
      }
      const sendFile = {
        title: title,
        createdBy: userID,
        videoType: videoType,
        youtubeVideoId: youtubeVideoId
      }
      if (desc) {
        sendFile.desc = desc;
      }
      const file = await Video.create(sendFile);
      await file.save();

      selectedChapter.resources.videos.push(file.id);
      await selectedChapter.save();

      res.status(200).json({
        success: true,
        data: file,
      });

    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ message: 'Server error.' });
    }

  } else {
    res.status(400).json({message: "Invalid video type"})
  }
};

// video file data set 

const videoFileData = async (req, res) => {

  const classId = req.params.classid;
  try {
    const videos_id = [];
    const class_room = await Classroom.findById(classId);
    if (!class_room) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // Now fetching the videos id from the class_room
    class_room.resources.videos.map((video, i) => {
      videos_id.push(video._id);
    })
    const files = await Video.find({ _id: { $in: videos_id } })
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).send('Error fetching files.');
  }
}



module.exports = {
  uploadVideo,
  videoFileData
}