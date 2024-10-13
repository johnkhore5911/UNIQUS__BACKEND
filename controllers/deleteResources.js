const Test = require('../models/Test')
const Classroom = require("../models/Classroom");
const Note = require("../models/Note")
const Video = require("../models/Video")
const Assignment = require('../models/Assignment');
const Chapter = require('../models/Chapters');
const fs = require('fs').promises;


const deleteTest = async (req, res, next) => {
  const { testid, classid, chapterid } = req.params;
  try {
    const test = await Test.findById(testid);
    if (!test) {
      return res.status(404).json({ message: 'No test found with the given ID in the classroom' });
    }
    const classroom = await Classroom.findById(classid);
    const chapter = await Chapter.findById(chapterid);
    const testIndex = chapter.resources.test.findIndex(test => test._id.toString() === testid);
    if (testIndex === -1) {
      return res.status(404).json({ message: 'No test found with the given ID in the classroom' });
    }
    if (test.isScheduled) {
      const currentTime = new Date();
      const testTime = new Date(test.scheduledTime)
      if (currentTime < testTime) {
        // Remove the test from the classroom's test array
        chapter.resources.test.splice(testIndex, 1);

        // Save the updated classroom
        await chapter.save();

        const response = await Test.findByIdAndDelete(testid);
        return res.status(200).json({ message: 'Test deleted successfully', response: response })
      } else {
        return res.status(403).json({ message: 'cannot delete test after scheduled time !' })
      }
    } else {
      if (test.isSubmit.length > 0) {
        return res.status(403).json({ message: 'Test attempted already, cannot delete test' })

        //  no deleting
      } else {
        // deleting
        // Remove the test from the classroom's test array
        chapter.resources.test.splice(testIndex, 1);

        // Save the updated classroom
        await chapter.save();
        const response = await Test.findByIdAndDelete(testid);
        return res.status(200).json({ message: 'Test deleted successfully', response: response })
      }

    }
  }

  catch (error) {
    console.log('error deleting test : ', error)
    res.status(403).json({ message: 'Internal server error, cannot delete test'})
  }


}

const deleteNote = async (req, res, next) => {
  const { noteid, classid, chapterid } = req.body;
  try {
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res.status(404).json({ message: 'No classroom found ' });
    }

    const fetchedChapter = await Chapter.findById(chapterid);
    const noteIndex = fetchedChapter.resources.notes.findIndex(note => note._id.toString() === noteid)
    if (noteIndex === -1) {
      return res.status(404).json({ message: 'No note found with the given ID in the classroom' });
    }

    fetchedChapter.resources.notes.splice(noteIndex, 1);

    // Save the updated classroom
    await fetchedChapter.save();

    const deletedNote = await Note.findByIdAndDelete(noteid);
    if (!deletedNote) {
      return res.status(404).json({ message: 'No note found with the given ID' });
    }
    // Remove the file from the server asynchronously
    // const filePath = deletedNote.filePath;
    // console.log('filepath::',filePath);
    // await fs.unlink(filePath); // Asynchronously delete the file
    // console.log('File deleted:', filePath);


    return res.status(200).json({ message: 'Deleted succesfully', response: deletedNote })
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'something went wrong  ', error: error.message })
  }
}

const deleteVideo = async (req, res, next) => {
  const { videoid, classid, chapterid } = req.body;
  try {
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res.status(404).json({ message: 'No classroom found ' });
    }
    const fetchedChapter = await Chapter.findById(chapterid);
    console.log(fetchedChapter)
    const videoIndex = fetchedChapter.resources.videos.findIndex(video => video._id.toString() === videoid);
    if (videoIndex === -1) {
      return res.status(404).json({ message: 'No video found with the given ID in the classroom' });
    }
    fetchedChapter.resources.videos.splice(videoIndex, 1);  
  
    // Save the updated classroom
    await fetchedChapter.save();
    const deletedVideo = await Video.findByIdAndDelete(videoid);
    if (!deletedVideo) {
      return res.status(404).json({ message: 'No video found with the given ID' });  
    }
    // Remove the file from the server asynchronously
    if (deletedVideo.videoType === 'upload') {
      const filePath = deletedVideo.filePath;   
      await fs.unlink(filePath); // Asynchronously delete the file
      // console.log('File deleted:', filePath);
    }
    return res.status(200).json({ message: 'Deleted succesfully', response: deletedVideo })
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'something went wrong  ', error: error.message })
  }
}

const deleteAssignment = async (req, res, next) => {
  const { assignmentid, classid } = req.params;
  // console.log(req.params,'kuch hai yhe');
  try {
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res.status(404).json({ message: 'No classroom found ' });
    }
    const assignmentIndex = classroom.resources.assignment.findIndex(assignment => assignment._id.toString() === assignmentid);
    if (assignmentIndex === -1) {
      return res.status(404).json({ message: 'No Assignment found with the given ID in the classroom' });
    }
    classroom.resources.assignment.splice(assignmentIndex, 1);

    // Save the updated classroom
    await classroom.save();
    const deletedAssingment = await Assignment.findByIdAndDelete(assignmentid);
    if (!deletedAssingment) {
      return res.status(404).json({ message: 'No Assignment found with the given ID' });
    }

    return res.status(200).json({ message: 'Deleted succesfully', response: deletedAssingment })
  } catch (error) {
    console.error('Error deleting Assignment:', error);
    res.status(500).json({ message: 'something went wrong  ', error: error.message })
  }
}


module.exports = { deleteTest, deleteNote, deleteVideo, deleteAssignment }