const Classroom = require("../models/Classroom");
const ExtractedQuestion = require("../models/ExtractedQuestions.js");
const { User } = require("../models/User");
const Chapter = require("../models/Chapters.js");
const Topic = require("../models/Topic.js")
const QuestionData = require("../models/QuestionData.js");
const { physics12thNCERT, chemistry12thNCERT, maths12thNCERT, biology12thNCERT, physics11thNCERT, chemistry11thNCERT, biology11thNCERT, mathematics11thNCERT } = require("../Data/curriculum_structure");
const Note = require("../models/Note.js");
const Video = require("../models/Video.js");
const Test = require("../models/Test.js");
const { Announcemnet } = require("../models/Announcement.js");
const Assignment = require("../models/Assignment.js");
const formatDateTime = require('../utils/formatDateTime');

const createClassroom = async (req, res, next) => {

    const userRole = req.user.userRole;
    if (!userRole) return sendStatus(401)

    if (userRole == 'teacher') {

        const title = req.body.title;
        const subject = req.body.subject;
        const createdBy = req.user.userID;
        const standard = req.body.standard;

        let curriculum_Structure = []
        // console.log(title, subject, createdBy)
        if (standard === "XI") {
            if (subject === "Physics") {
                curriculum_Structure = physics11thNCERT

            } else if (subject === "Chemistry") {
                curriculum_Structure = chemistry11thNCERT

            } else if (subject === "Maths") {
                curriculum_Structure = mathematics11thNCERT

            } else if (subject === "Biology") {
                curriculum_Structure = biology11thNCERT

            } else {
                curriculum_Structure = []
            }

        } else if (standard === "XII") {
            if (subject === "Physics") {
                curriculum_Structure = physics12thNCERT

            } else if (subject === "Chemistry") {
                curriculum_Structure = chemistry12thNCERT

            } else if (subject === "Maths") {
                curriculum_Structure = maths12thNCERT

            } else if (subject === "Biology") {
                curriculum_Structure = biology12thNCERT

            } else {
                curriculum_Structure = []
            }
        }

        try {
            // Create chapters for each chapter in the curriculum structure
            const createdChapters = await Promise.all(curriculum_Structure.map(async chapter => {
                const topics = await Promise.all(chapter.topicsArray.map(async topic => {
                    const createdTopic = await Topic.create({
                        topicName: topic.topicName
                    });
                    return createdTopic._id;
                }));

                const createdChapter = await Chapter.create({
                    chapterTitle: chapter.chapterTitle,
                    topicsArray: topics
                });
                return createdChapter._id;
            }));

            // Create the classroom with the curriculum structure referencing the newly created chapters
            const classroom = await Classroom.create({
                title,
                subject,
                standard,
                createdBy,
                curriculum_Structure: createdChapters
            });

            // Update the teacher's user document with the new classroom ID
            const user = await User.findById(req.user.userID);
            user.classroomsArray.push(classroom._id);
            await user.save();

            res.status(200).json({
                success: true,
                classID: classroom._id,
            });
        } catch (err) {
            next(err);
        }
    }
}

const fetchClassroom = async (req, res, next) => {
    const userRole = req.user.userRole;
    const classid = req.params.classid;

    try {
        let classData = {
            title: "",
            subject: "",
            createdBy: "",
            createdAt: "",
            resources: [],
            curriculum_Structure: []
        }
        let curriculumArray = [];
        const classRoom = await Classroom.findById(classid)
        if (!classRoom) {
            res.status(404).json({ message: "Classroom not found" })
        }
        let resources = [];
        if (userRole === "teacher") {
            const curriculum_Structure = classRoom.curriculum_Structure;
            for (const chapterID of curriculum_Structure) {
                try {
                    const selectedChapter = await Chapter.findById(chapterID.toString());
                    const chapterObject = {
                        id: selectedChapter._id,
                        title: selectedChapter.chapterTitle,
                        isLocked: selectedChapter.isLocked
                    }
                    curriculumArray.push(chapterObject);
                    if (selectedChapter.isLocked == false) {
                        const notesArray = selectedChapter.resources.notes;
                        const videoArray = selectedChapter.resources.videos;
                        const testsArray = selectedChapter.resources.test;
                        // fetching all notes in the chapter
                        let notes = [];
                        for (const _id of notesArray) {
                            try {
                                const selectedNote = await Note.findById(_id.toString());
                                if (selectedNote) {
                                    const noteData = {
                                        id: selectedNote._id,
                                        title: selectedNote.title ? selectedNote.title : "",
                                        desc: selectedNote.desc ? selectedNote.desc : "",
                                        filename: selectedNote.filename ? selectedNote.filename : "",
                                        originalname: selectedNote.originalname ? selectedNote.originalname : ""
                                    }
                                    notes.push(noteData);
                                }

                            } catch (err) {
                                console.log(`error fetching note with id: ${_id.toString()} : `, err);
                            }
                        }

                        // fetching all videos in the chapter
                        let videos = [];
                        for (const _id of videoArray) {
                            try {
                                const selectedVideo = await Video.findById(_id.toString());
                                if (selectedVideo) {
                                    const videoData = {
                                        id: selectedVideo._id,
                                        title: selectedVideo.title ? selectedVideo.title : "",
                                        desc: selectedVideo.desc ? selectedVideo.desc : "",
                                        filename: selectedVideo.filename ? selectedVideo.filename : "",
                                        originalname: selectedVideo.originalname ? selectedVideo.originalname : "",
                                        youtubeVideoId: selectedVideo.youtubeVideoId ? selectedVideo.youtubeVideoId : "",
                                        filePath: selectedVideo.filePath ? selectedVideo.filePath : "",
                                        videoType: selectedVideo.videoType ? selectedVideo.videoType : "",
                                    }
                                    videos.push(videoData);
                                }

                            } catch (err) {
                                console.log(`error fetching video with id: ${_id.toString()} : `, err);
                            }
                        }

                        // fetching all tests in the chapter
                        let tests = [];
                        for (const _id of testsArray) {
                            try {
                                const selectedTest = await Test.findById(_id.toString());
                                if (selectedTest) {
                                    const formattedscheduleDateTime = formatDateTime(selectedTest.scheduledTime);
                                    const formattedDeadline = formatDateTime(selectedTest.Deadline);
                                    const testData = {
                                        id: selectedTest._id,
                                        title: selectedTest.title ? selectedTest.title : "",
                                        createdAt: selectedTest.createdAt ? selectedTest.createdAt : "",
                                        isScheduled: selectedTest.isScheduled ? selectedTest.isScheduled : "",
                                        scheduledDate: formattedscheduleDateTime.date ? formattedscheduleDateTime.date : "",
                                        scheduledTime: formattedscheduleDateTime.time ? formattedscheduleDateTime.time : "",
                                        deadlineDate: formattedDeadline.date ? formattedDeadline.date : "",
                                        deadlineTime: formattedDeadline.time ? formattedDeadline.time : "",
                                        submittedby: selectedTest.isSubmit.length > 0 ? selectedTest.isSubmit.length : 0,
                                        duration: selectedTest.duration ? selectedTest.duration : 0,
                                    }
                                    tests.push(testData);
                                }

                            } catch (err) {
                                console.log(`error fetching test with id: ${_id.toString()} : `, err);
                            }
                        }
                        const chapterData = {
                            chapterID: selectedChapter._id,
                            chapterTitle: selectedChapter.chapterTitle ? selectedChapter.chapterTitle : "",
                            notes: notes,
                            videos: videos,
                            tests: tests
                        }
                        resources.push(chapterData)
                    }
                } catch (err) {
                    console.log(`Error fetching chapter with id ${chapterID.toString()} :`, err)
                }
            }

        } else if (userRole === "student") {
            const curriculum_Structure = classRoom.curriculum_Structure;
            for (const chapterID of curriculum_Structure) {
                try {
                    const selectedChapter = await Chapter.findById(chapterID.toString());
                    if (selectedChapter.isLocked == false) {
                        const notesArray = selectedChapter.resources.notes;
                        const videoArray = selectedChapter.resources.videos;
                        const testsArray = selectedChapter.resources.test;

                        // fetching all notes in the chapter
                        let notes = [];
                        for (const _id of notesArray) {
                            try {
                                const selectedNote = await Note.findById(_id.toString());
                                if (selectedNote) {
                                    const noteData = {
                                        id: selectedNote._id,
                                        title: selectedNote.title ? selectedNote.title : "",
                                        desc: selectedNote.desc ? selectedNote.desc : "",
                                        filename: selectedNote.filename ? selectedNote.filename : "",
                                        originalname: selectedNote.originalname ? selectedNote.originalname : ""
                                    }
                                    notes.push(noteData);
                                }

                            } catch (err) {
                                console.log(`error fetching note with id: ${_id.toString()} : `, err);
                            }
                        }

                        // fetching all videos in the chapter
                        let videos = [];
                        for (const _id of videoArray) {
                            try {
                                const selectedVideo = await Video.findById(_id.toString());
                                if (selectedVideo) {
                                    const videoData = {
                                        id: selectedVideo._id,
                                        title: selectedVideo.title ? selectedVideo.title : "",
                                        desc: selectedVideo.desc ? selectedVideo.desc : "",
                                        filename: selectedVideo.filename ? selectedVideo.filename : "",
                                        originalname: selectedVideo.originalname ? selectedVideo.originalname : "",
                                        youtubeVideoId: selectedVideo.youtubeVideoId ? selectedVideo.youtubeVideoId : "",
                                        filePath: selectedVideo.filePath ? selectedVideo.filePath : "",
                                        videoType: selectedVideo.videoType ? selectedVideo.videoType : "",
                                    }
                                    videos.push(videoData);
                                }

                            } catch (err) {
                                console.log(`error fetching video with id: ${_id.toString()} : `, err);
                            }
                        }

                        // fetching all tests in the chapter
                        let tests = [];
                        for (const _id of testsArray) {
                            try {
                                const selectedTest = await Test.findById(_id.toString());
                                if (selectedTest) {
                                    const testData = {
                                        id: selectedTest._id,
                                        title: selectedTest.title ? selectedTest.title : "",
                                        createdAt: selectedTest.createdAt ? selectedTest.createdAt : "",
                                        isScheduled: selectedTest.isScheduled ? selectedTest.isScheduled : "",
                                        scheduledAt: selectedTest.scheduledTime ? selectedTest.scheduledTime : "",
                                        deadline: selectedTest.Deadline ? selectedTest.Deadline : "",
                                        duration: selectedTest.duration ? selectedTest.duration : 0,
                                    }
                                    tests.push(testData);
                                }

                            } catch (err) {
                                console.log(`error fetching test with id: ${_id.toString()} : `, err);
                            }
                        }
                        const chapterData = {
                            chapterID: selectedChapter._id,
                            chapterTitle: selectedChapter.chapterTitle ? selectedChapter.chapterTitle : "",
                            notes: notes,
                            videos: videos,
                            tests: tests
                        }
                        resources.push(chapterData)
                    }
                } catch (err) {
                    console.log(`Error fetching chapter with id ${chapterID.toString()} :`, err)
                }
            }

        } else {
            res.status(401).json({ message: "You are not authorized to access this resource" })
        }

        classData.title = classRoom.title;
        classData.subject = classRoom.subject;
        classData.resources = resources;
        classData.createdBy = classRoom.createdBy;
        classData.createdAt = classRoom.createdAt;
        classData.curriculum_Structure = curriculumArray;

        console.log(classData)

        res.status(200).json({ classData: classData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Internal server error, try again" });
    }

}

const fetchCurriculum = async (req, res, next) => {
    const userRole = req.user.userRole;
    const userID = req.user.userID;
    const classid = req.params.classid;

    if (userRole === "student") {
        res.status(401).json({ message: "not allowed" })
    }
    else if (userRole === "teacher") {
        try {
            const classroom = await Classroom.findById(classid).populate({
                path: 'curriculum_Structure',
                populate: {
                    path: 'topicsArray',
                    model: 'Topic'
                }
            })
            if (!classroom) {
                res.status(404).json({ message: "class not found" })
            }
            const curriculumStructure = classroom.curriculum_Structure.map(chapter => ({
                _id: chapter._id,
                chapterTitle: chapter.chapterTitle,
                topicsArray: chapter.topicsArray,
                isLocked: chapter.isLocked
            }));
            res.status(200).json({ curriculum: curriculumStructure });
        } catch (err) {
            console.log("error fetching classroom", err)
            next(err)
        }
    } else {
        res.status(401).json({ message: "invalid userRole" })
    }

}

const allowChapterExcess = async (req, res, next) => {
    const userRole = req.user.userRole;
    const chapterid = req.params.chapterid;

    if (userRole !== "teacher") {
        res.status(401).json({ message: "you are not authorized to perform this action" })
    }

    try {
        const selectedChapter = await Chapter.findById(chapterid);
        if (selectedChapter.isLocked == true) {
            selectedChapter.isLocked = false;
            await selectedChapter.save()
            res.status(200).json({ success: true, message: "chapter added successfully" })

        } else if (selectedChapter.isLocked == false) {
            res.status(405).json({ success: false, message: "chapter added already" })

        } else {
            res.status(404).status({ success: false, message: "chapter may not exists, try creating the chapter first" })
        }

    } catch (err) {
        console.log(`error fetching and unlocking chapter with id ${chapterid} : `, err);
        res.status(500).json({ success: false, message: "internal server error" })
    }
}

const addChapter = async (req, res) => {
    const userRole = req.user.userRole;
    const classid = req.params.classid;
    const { chapterTitle } = req.body;

    if (userRole !== "teacher") {
        res.status(401).json({ message: "Only teachers are allowed to add chapters" });
    }

    try {
        const classroom = await Classroom.findById(classid);

        if (!classroom) {
            return res.status(404).json({ message: "Class not found for adding the chapter" });
        }

        const newChapter = new Chapter({ chapterTitle });
        const savedChapter = await newChapter.save();
        classroom.curriculum_Structure.push(savedChapter._id);

        await classroom.save();

        const updatedClassroom = await Classroom.findById(classid).populate({
            path: 'curriculum_Structure',
            populate: {
                path: 'topicsArray',
                model: 'Topic'
            }
        });

        return res.status(200).json({ success: true, message: "Chapter added successfully", curriculum: updatedClassroom.curriculum_Structure });
    } catch (error) {
        console.error("Error adding chapter:", error);
        return res.status(500).json({ success: false, message: "Internal server error in the add chapter controller" });
    }
}

const addTopic = async (req, res, next) => {
    const userRole = req.user.userRole;
    const classid = req.params.classId;
    const topicName = req.body.topicName;
    const chapterId = req.params.chapterId;

    if (userRole === "student") {
        res.status(401).json({ message: "Not allowed" });
    } else if (userRole === "teacher") {
        try {
            const classroom = await Classroom.findById(classid);
            if (!classroom) {
                return res.status(404).json({ message: "Class not found" });
            }

            const chapter = await Chapter.findById(chapterId);
            if (!chapter) {
                return res.status(404).json({ message: "Chapter not found" });
            }

            const newTopic = new Topic({ topicName });
            const savedTopic = await newTopic.save();

            chapter.topicsArray.push(savedTopic._id);
            await chapter.save();

            res.status(200).json({ message: "Topic added successfully" });
        } catch (err) {
            console.log("Error adding topic:", err);
            next(err);
        }
    } else {
        res.status(401).json({ message: "Invalid userRole" });
    }
};

const addExtractedQuestions = async (req, res) => {
    const userRole = req.user.userRole;
    const userID = req.user.userID;
    const classid = req.params.classid;
    const chapterid = req.params.chapterid;
    const topicid = req.params.topicid;

    console.log(req.file);

    if (userRole === "student") {
        return res.status(401).json({ message: "Not allowed" });
    } else if (userRole === "teacher") {
        try {
            const { topicName, correctAnswerIndex, ...questionDetails } = req.body;
            const classroom = await Classroom.findById(classid);

            if (!classroom) {
                return res.status(404).json({ message: "Class not found" });
            }

            const Existchapter = classroom.curriculum_Structure.find(chap => chap._id.toString() === chapterid);
            if (!Existchapter) {
                return res.status(404).json({ message: "Chapter not found" });
            }

            const chapter = await Chapter.findById(chapterid);
            if (!chapter.topicsArray || !chapter.topicsArray.includes(topicid)) {
                return res.status(404).json({ message: "Topic not found in the specified chapter" });
            }
            const topic = await Topic.findById(topicid);
            if (!topic) {
                return res.status(404).json({ message: "Topic not found" });
            }

            const newQuestion = new QuestionData({
                ...questionDetails,
                answerKey: correctAnswerIndex,
                topic: topicName,
                chapter: chapter.chapterTitle
            });

            if (req.file) {
                newQuestion.image = {
                    name: req.file.originalname,
                    data: req.file.path
                };
            }

            await newQuestion.save();
            console.log("This is the new Extracted Question Saved: ", newQuestion);
            topic.extractedQuestions.push(newQuestion._id);

            await topic.save();
            return res.status(200).json({ message: "Extracted questions added successfully" });
        } catch (err) {
            console.log("Error adding extracted questions:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    } else {
        return res.status(401).json({ message: "Invalid userRole" });
    }
};



const fetchExtractedQuestions = async (req, res) => {
    const { classid, chapterid, topicid } = req.params;
    try {
        const classroom = await Classroom.findById(classid);
        if (!classroom) {
            return res.status(404).json({ message: "Class not found in fetching the extracted Questions" });
        }

        const chapter = await Chapter.findById(chapterid).populate({
            path: 'topicsArray',
            populate: {
                path: 'extractedQuestions',
                model: 'QuestionData'
            }
        });

        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found in fetching the extracted Questions" });
        }

        const topic = chapter.topicsArray.find(topic => topic._id.toString() === topicid);
        if (!topic) {
            return res.status(404).json({ message: "Topic not found in fetching the extracted Questions" });
        }

        const extractedQuestions = topic.extractedQuestions;

        return res.status(200).json({ extractedQuestions });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error in fetching the extracted Questions" });
    }
}

const deleteTopic = async (req, res) => {
    const userRole = req.user.userRole;
    const classid = req.params.classid;
    const chapterid = req.params.chapterid;
    const topicid = req.params.topicid;

    if (userRole !== "teacher") {
        return res.status(401).json({ message: "Only teachers are allowed to delete topics" });
    }

    try {
        const classroom = await Classroom.findById(classid);
        if (!classroom) {
            return res.status(404).json({ message: "Class not found while deleting the topic" });
        }
        const CheckChapter = classroom.curriculum_Structure.find(chap => chap._id.toString() === chapterid);
        if (!CheckChapter) {
            return res.status(404).json({ message: "Chapter not found while deleting the topic as it is not present in the curriculum" });
        }
        const chapter = await Chapter.findById(chapterid);
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found while deleting the topic" });
        }
        const checkTopic = chapter.topicsArray.find(topic => topic._id.toString() === topicid)
        if (!checkTopic) {
            return res.status(404).json({ message: "Topic not found in the Chapter while deleting the topic" });
        }

        const topic = await Topic.findById(topicid);
        if (!topic) {
            return res.status(404).json({ message: "Topic not found while deleting the topic" });
        }
        chapter.topicsArray.pull(topicid);
        await chapter.save();
        await Topic.findByIdAndDelete(topicid);

        // Send success response after deletion
        return res.status(200).json({ message: "Topic deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error while deleting the Topic " });
    }
}

const deleteChapter = async (req, res) => {
    const userRole = req.user.userRole;
    const classid = req.params.classid;
    const chapterid = req.params.chapterid;

    if (userRole !== "teacher") {
        return res.status(401).json({ message: "Only teachers are allowed to delete chapters" });
    }

    try {
        console.log(classid, chapterid);
        const classroom = await Classroom.findById(classid);
        if (!classroom) {
            return res.status(404).json({ message: "Class not found while deleting the chapter" });
        }

        classroom.curriculum_Structure.pull(chapterid);
        await classroom.save();

        const deletedChapter = await Chapter.findById(chapterid);
        if (deletedChapter) {
            const topicIds = deletedChapter.topicsArray;
            await Topic.deleteMany({ _id: { $in: topicIds } });
        }

        await Chapter.findByIdAndDelete(chapterid);


        console.log("Chapter and its topics deleted successfully");

        return res.status(200).json({ message: "Chapter deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error while deleting the chapter" });
    }
};

const deleteClassRoom = async (req, res) => {
    const classId = req.body.classId;
    if (!classId) {
        throw new Error('Class ID is required');
    }

    try {
        const classRoom = await Classroom.findById(classId);
        if (!classRoom) {
            console.log("No classroom");
            throw new Error('Class not found');
        }

        const { curriculum_Structure: chapters, announcements, members, createdBy } = classRoom;

        // Fetch and delete all chapters and their associated resources in parallel
        await Promise.all(chapters.map(async (chapterId) => {
            const chapter = await Chapter.findById(chapterId);
            if (chapter) {
                const { notes, test, assignment, videos } = chapter.resources;
                const topics = chapter.topicsArray;

                const resourceDeletionPromises = [
                    ...notes.map(noteId => Note.findByIdAndDelete(noteId)),
                    ...videos.map(videoId => Video.findByIdAndDelete(videoId)),
                    ...test.map(testId => Test.findByIdAndDelete(testId)),
                    ...assignment.map(assignmentId => Assignment.findByIdAndDelete(assignmentId)),
                    ...topics.map(topicId => Topic.findByIdAndDelete(topicId))
                ];

                await Promise.all(resourceDeletionPromises);
                await Chapter.findByIdAndDelete(chapterId);
            }
        }));

        // Delete announcements in parallel
        await Promise.all(announcements.map(id => Announcement.findByIdAndDelete(id)));

        // Update members to remove the classId from their classroomsArray
        await Promise.all(members.map(({ id: userId }) =>
            User.findByIdAndUpdate(userId, {
                $pull: { classroomsArray: classId }
            })
        ));

        // Remove the classroom ID from the classroom owner's classroomsArray
        await User.findByIdAndUpdate(createdBy, {
            $pull: { classroomsArray: classId }
        });

        // Finally, delete the classroom
        await classRoom.deleteOne();

        console.log("deleted the classroom")

        res.status(200).json({ success: true, message: "Classroom deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


const FetchTopicInsideChapter = async (req, res) => {
    const userRole = req.user.userRole;
    const classid = req.params.classid;
    const chapterid = req.params.chapterID;

    if (userRole !== "teacher") {
        return res.status(401).json({ message: "Only teachers are allowed to fetch topics" });
    }
    try {
        const classroom = await Classroom.findById(classid);
        if (!classroom) {
            return res.status(404).json({ message: "Class not found while fetching topics" });
        }
        const CheckChapter = classroom.curriculum_Structure.find(chap => chap._id.toString() === chapterid);
        if (!CheckChapter) {
            return res.status(404).json({ message: "Chapter not found while fetching topics as it is not present in the curriculum" });
        }
        const chapter = await Chapter.findById(chapterid).populate('topicsArray');
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found while fetching topics" });
        }
        const topics = chapter.topicsArray;
        return res.status(200).json({ topics });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error while fetching topics" });
    }
}

module.exports = {
    createClassroom,
    fetchClassroom,
    fetchCurriculum,
    addTopic,
    addExtractedQuestions,
    fetchExtractedQuestions,
    addChapter,
    deleteTopic,
    deleteChapter,
    allowChapterExcess,
    deleteClassRoom,
    FetchTopicInsideChapter
}