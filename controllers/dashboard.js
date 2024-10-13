const Classroom = require("../models/Classroom");
const { User } = require('../models/User')
const Test = require('../models/Test');
const Chapter = require("../models/Chapters");


const getData = async (req, res, next) => {
  console.log("Dashboard is hit")
  const { userID, userRole } = req.user;
  const { classid } = req.params;
  let test = []
  let data = {
    classMetaData : {
      classTitle: "",
      students: 0,
      notes: 0,
      lectures: 0,
      assignments: 0,
      tests: 0
    }
  }

  try {
    if (userRole !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can excess dashboard." });
    }
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res
        .status(404)
        .json({ error: "No classroom exist with this id" });
    }
    data.classMetaData.classTitle = classroom.title;
    data.classMetaData.students = classroom.members.length ? classroom.members.length : 0;
    for (i in classroom.curriculum_Structure) {
      const selectedChapterID = classroom.curriculum_Structure[i];
      const fetchedChapter = await Chapter.findById(selectedChapterID);
      if(fetchedChapter != null && fetchedChapter.isLocked == false) {
        data.classMetaData.notes = data.classMetaData.notes + fetchedChapter.resources.notes.length;
        data.classMetaData.lectures = data.classMetaData.lectures + fetchedChapter.resources.videos.length;
        data.classMetaData.assignments = data.classMetaData.assignments + fetchedChapter.resources.assignment.length;
        data.classMetaData.tests = data.classMetaData.tests + fetchedChapter.resources.test.length;
      }
    }
    // const students = classroom.members.length
    // const lecture = classroom.resources.videos.length;
    // const test_ids = classroom.resources.test;
    // const assignment = classroom.resources.assignment.length;
    // const tests = test_ids.length;
    // if (tests.length > 0) {
    //   const testsData = await Test.find({ _id: { $in: test_ids } });
    //   const testEfficiency = testsData.map((test) => test.testEff)
    //   const overall_effiency = classroom.classroomEff;
    //   const weakTopics = classroom.averageWeakTopics;
    //   const specialCareStudents = classroom.averageSpecialCareStudents;
    //   data = { students, lecture, tests, assignment, weakTopics, specialCareStudents, overall_effiency, testEfficiency }
    // }
    // else {
    //   data = { students, lecture, tests, assignment }
    // }
    // console.log('yhe hai data',classroom);  
    res.json({ data: data })
  } catch (error) {
    next(error);
  }
}

module.exports = { getData }