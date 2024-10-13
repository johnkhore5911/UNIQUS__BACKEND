const Classroom = require("../models/Classroom");
const QuestionData = require("../models/QuestionData");
const Test = require("../models/Test");
const effiencyCalculator = require("./effiencyCalculator");
const Chapter = require("../models/Chapters");
const formatDateTime = require("../utils/formatDateTime");
const Topic = require("../models/Topic");


const testMetaData = async (req, res, next) => {
  console.log("Route working")
  const { userID, userRole } = req.user;
  const { classid, testid } = req.params;

  let metaData = {};
  try {
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      res.status(404).json({ message: "Classroom not found" });
    }

    try {
      const test = await Test.findById(testid);
      if (!test) {
        res.status(404).json({ message: "Test not found" });
      }
      if (userRole === "teacher") {
        res.status(401).json({ message: "not authorized to access this page" });
      } else if (userRole === "student") {
        const userIsSubmit = test.isSubmit.find((userStatus) =>
          userStatus.userID.equals(userID)
        );
        const userSubmitTime = test.submitTime.find((userStatus) =>
          userStatus.userID.equals(userID)
        );
        let submitDate = "";
        let submitTime = "";
        let startDate = "";
        let startTime = "";
        let deadlineDate = "";
        let deadlineTime = "";
        if (userSubmitTime) {
          const formattedDateTime = formatDateTime(userSubmitTime.submitTime);
          submitDate = formattedDateTime.date;
          submitTime = formattedDateTime.time;
        }
        if (test.scheduledTime) {
          const formattedStartDateTime = formatDateTime(test.scheduledTime);
          startDate = formattedStartDateTime.date;
          startTime = formattedStartDateTime.time;
        }
        if (test.Deadline) {
          const formattedDeadline = formatDateTime(test.Deadline);
          deadlineDate = formattedDeadline.date;
          deadlineTime = formattedDeadline.time;
        }
        metaData = {
          testID: test._id,
          name: test.title,
          isSubmit: userIsSubmit ? true : false,
          submitDate: submitDate,
          submitTime: submitTime,
          startDate: startDate,
          startTime: startTime,
          deadlineDate: deadlineDate,
          deadlineTime: deadlineTime,
          deadline: test.Deadline,
          scheduledAt: test.scheduledTime,
          startDateTime: test.scheduledTime ? test.scheduledTime : " ",
          isScheduled: test.isScheduled ? test.isScheduled : false,
          duration: test.duration ? test.duration : 0,
          instruction: test.instruction ? test.instruction : [],
          duration: test.duration ? test.duration : 0,
        };
      }
    } catch (err) {
      console.log("Error fetching Test", err);
      next(err);
    }
  } catch (err) {
    console.log("Error fetching classroom", err);
    next(err);
  }
  console.log("yhe hai test hai", metaData);
  res.status(200).send(metaData);
};

const addTestToClassroom = async (req, res, next) => {
  console.log("addTestToClassroom");
  const { userID, userRole } = req.user;
  const { classid, chapterid } = req.params;
  console.log({ userID, userRole, classid, chapterid, body: req.body });
  const questionData = JSON.parse(req.body.questionData);
  const instructionsArray = JSON.parse(req.body.instructionsArray);
  const { title, deadline, isScheduled, startDateTime, duration } = req.body;
  const images = req.files;

  try {
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    if (userRole !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can add assignments." });
    }
    const selectedChapter = await Chapter.findById(chapterid);
    if (!selectedChapter) {
      return res.status(404).json({ message: "chapter not found" });
    }
    if (selectedChapter.isLocked) {
      return res.status(405).json({ message: "action not allowed" });
    }

    const questions = [];
    const uniqueQuestionData = [];
    for (const qData of questionData) {
      const existingQuestion = await QuestionData.findOne({
        content: qData.questionText,
      });
      if (!existingQuestion) {
        uniqueQuestionData.push(qData);
      } else {
        questions.push(existingQuestion);
      }
    }

    for (const qData of uniqueQuestionData) {
      let imageObj = null;
      if (qData.imageName) {
        const imageFile = images.find(
          (file) => file.originalname === qData.imageName
        );
        if (imageFile) {
          imageObj = {
            name: imageFile.originalname,
            data: `uploads/images/${imageFile.filename}`,
          };
        }
      }
      const question = new QuestionData({
        content: qData.questionText,
        image: imageObj,
        options: qData.options.map((o) => o.optionText),
        answerKey: qData.answerKey,
        difficulty: qData.difficulty,
        topic: qData.topic,
        chapter: selectedChapter.chapterTitle,
      });
      await question.save();

      const topicId = qData.topic;
      const thetopic = await Topic.findById(topicId);
      if (!thetopic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      thetopic.extractedQuestions = thetopic.extractedQuestions || [];
      thetopic.extractedQuestions.push(question._id);
      await thetopic.save();

      questions.push(question);
    }

    const test = new Test({
      title,
      createdBy: userID,
      questionData: questions,
      Deadline: deadline,
      instruction: instructionsArray,
      isScheduled,
      scheduledTime: startDateTime,
      duration,
    });
    await test.save();
    selectedChapter.resources.test.push(test._id);
    await selectedChapter.save();

    console.log({ test, selectedChapter });

    const formattedscheduleDateTime = formatDateTime(test.scheduledTime);
    const formattedDeadline = formatDateTime(test.Deadline);

    res.status(201).json({
      success: true,
      test: {
        id: test._id,
        title: test.title ? test.title : "",
        createdAt: test.createdAt ? test.createdAt : "",
        isScheduled: test.isScheduled ? test.isScheduled : "",
        scheduledDate: formattedscheduleDateTime.date
          ? formattedscheduleDateTime.date
          : "",
        scheduledTime: formattedscheduleDateTime.time
          ? formattedscheduleDateTime.time
          : "",
        deadlineDate: formattedDeadline.date ? formattedDeadline.date : "",
        deadlineTime: formattedDeadline.time ? formattedDeadline.time : "",
        submittedby: test.isSubmit.length > 0 ? test.isSubmit.length : 0,
        duration: test.duration ? test.duration : 0,
      },
    });
  } catch (error) {
    console.log("Error saving test: ", error);
    next(error);
  }
};

const fetchAllTests = async (req, res, next) => {
  const userID = req.user.userID;
  const classroomId = req.params.classid;
  const userRole = req.user.userRole;

  try {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    const test_ID_Array = classroom.resources.test;
    const TestsArray = [];
    for (const i in test_ID_Array) {
      let testsInfo = {};
      try {
        const test = await Test.findById(test_ID_Array[i]);
        if (test) {
          if (userRole === "teacher") {
            let submittedby = 0;
            submittedby = test.isSubmit.length;
            testsInfo = {
              id: test._id,
              title: test.title,
              createdAt: test.createdAt,
              isScheduled: test.isScheduled,
              scheduledAt: test.scheduledTime,
              deadline: test.Deadline,
              submittedby: submittedby,
              duration: test.duration ? test.duration : 0,
            };
            TestsArray.push(testsInfo);
          } else if (userRole === "student") {
            let submittedby = 0;
            submittedby = test.isSubmit.length;
            let scheduledDay = "";

            try {
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);

              const formateDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                // Format date as "yyyy-mm-dd"
                const formattedDate = `${year}-${month}-${day}`;
                return formattedDate;
              };

              const formattedToday = formateDate(today);
              const formattedTomorrow = formateDate(tomorrow);

              const dateOfTest = test.scheduledTime;
              if (dateOfTest) {
                const testDate = dateOfTest.toString().split("T")[0];
                if (formattedToday === testDate) {
                  scheduledDay = "today";
                } else if (formattedTomorrow === testDate) {
                  scheduledDay = "tomorrow";
                }
              }
            } catch (err) {
              // console.log("error finding scheduledDay for test", err)
              next(err);
            }
            testsInfo = {
              id: test._id,
              title: test.title,
              createdAt: test.createdAt,
              isScheduled: test.isScheduled,
              scheduledAt: test.scheduledTime,
              deadline: test.Deadline,
              submittedby: submittedby,
              scheduledDay: scheduledDay,
              duration: test.duration ? test.duration : 0,
            };
            TestsArray.push(testsInfo);
          }
        }
      } catch (error) {
        console.error("error fetching test", error);
        next(error);
      }
    }
    res.status(200).json({ TestsArray: TestsArray });
  } catch (err) {
    console.log(err);
  }
};

const getTest = async (req, res, next) => {
  const { userID, userRole } = req.user;
  const { classid, testid } = req.params;

  try {
    const classroom = await Classroom.findById(classid);
    const test = await Test.findById(testid)
      .populate("questionData")
      .populate("submissions.userID", "firstName lastName");

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    let end_time = 0;
    let testend;
    if (test.isScheduled) {
      const currentTime = new Date();
      testend = test.scheduledTime.getTime() + test.duration * 60000;
      const timeDifferenceMs =
        currentTime.getTime() - test.scheduledTime.getTime();
      const timeDifferenceMinutes = Math.round(timeDifferenceMs / (1000 * 60));
      if (timeDifferenceMinutes >= 0 && timeDifferenceMinutes < test.duration) {
        end_time = timeDifferenceMinutes;
      }
    }

    let testData = {};

    // To create an array of topics to send topicName along with all the questions
    // Extract all unique topic IDs from the questions
    const topicIds = [
      ...new Set(test.questionData.map((question) => question.topic)),
    ];

    // Fetch the topic details from the database
    const topics = await Topic.find({ _id: { $in: topicIds } });

    // Create a map of topic IDs to topic names
    const topicMap = topics.reduce((map, topic) => {
      map[topic._id] = topic.topicName;
      return map;
    }, {});

    if (userRole === "teacher") {
      testData = {
        _id: test._id,
        title: test.title,
        createdAt: test.createdAt,
        instruction: test.instruction,
        Deadline: test.Deadline,
        questionData: test.questionData.map((question) => ({
          _id: question._id,
          content: question.content,
          options: question.options,
          image: question.image,
          answerKey: question.answerKey,
          difficulty: question.difficulty,
          topic: topicMap[question.topic] || "",
        })),
        submissions: test.submissions.map((submission) => ({
          userID: submission.userID._id,
          userName: `${submission.userID.firstName} ${submission.userID.lastName}`,
          score: submission.score,
          submitTime: submission.submitTime,
          questionResults: submission.questionResult.map((result) => ({
            questionID: result.questionID,
            isCorrect: result.isCorrect,
            attemptedAnswerIndex: result.attemptedAnswerIndex,
          })),
        })),
      };
    } else if (userRole === "student") {
      const userIsSubmit = test.isSubmit.find((status) =>
        status.userID.equals(userID)
      );
      const userSubmission = test.submissions.find((submission) =>
        submission.userID.equals(userID)
      );

      const testend = test.scheduledTime + test.duration;
      testData = {
        _id: test._id,
        title: test.title,
        createdBy: test.createdBy,
        createdAt: test.createdAt,
        instruction: test.instruction,
        Deadline: test.Deadline,
        isSubmit: userIsSubmit ? userIsSubmit.isSubmit : false,
        submitTime: userSubmission ? userSubmission.submitTime : " ",
        onTime: test.onTime,
        startDateTime: test.scheduledTime,
        duration: test.duration ? test.duration : 0,
        testend: testend ? testend : 0,
        questionData: test.questionData.map((question) => {
          return {
            _id: question._id,
            content: question.content,
            options: question.options,
            image: question.image,
            response: [
              {
                response: -1,
                review: "",
              },
            ],
          };
        }),
      };
    }

    res.status(200).send(testData);
  } catch (error) {
    next(error);
  }
};
// writing a new controller cuz i dont want to break the code or get some new error instead
const submitTest = async (req, res, next) => {
  const userID = req.user.userID;
  const classroomId = req.params.classid;
  const testId = req.params.testid;
  const isDraft = req.params.draft === "draft";
  try {
    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    const test = await Test.findById(testId);
    const duration = test.duration;
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    if (req.user.userRole !== "student") {
      return res.status(403).json({ error: "Only students can submit test." });
    }
    const userIsSubmit = test.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res.status(400).json({ error: "Test is already submitted." });
    }
    if (!isDraft) {
      if (!userIsSubmit) {
        test.isSubmit.push({ userID: userID, isSubmit: true });
      } else {
        userIsSubmit.isSubmit = true;
      }
      test.submitTime.push({
        userID: userID,
        submitTime: new Date(),
      });
      await test.save();
      console.log("submit hogaya");
      // only when the test type is scheduled
      if (test.isScheduled) {
        if (test.isSubmit.length === 4) {
          effiencyCalculator(test, classroomId);
        }
      }
      // effiencyCalculator(test,classroomId);
    }
    res
      .status(200)
      .json({ success: true, message: "Test submitted successfully." });
  } catch (error) {
    next(error);
  }
};

const submitTestResponse = async (req, res, next) => {
  const userID = req.user.userID;
  const classroomId = req.params.classid;
  const testId = req.params.testid;
  const isDraft = req.params.draft === "draft";

  try {
    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    if (req.user.userRole !== "student") {
      return res.status(403).json({ error: "Only students can submit test." });
    }

    const userIsSubmit = test.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res.status(400).json({ error: "Test is already submitted." });
    }

    const response = req.body;
    const questionId = response.questionID;
    const userResponse = parseInt(response.response, 10);
    let isCorrect;
    if (userResponse === -1) {
      isCorrect = "notAttempted";
    } else {
      if (userResponse === test.answerKey) {
        isCorrect = true;
      } else {
        isCorrect = false;
      }
    }
    const question = await QuestionData.findOne({ _id: questionId });
    if (question) {
      const userQuestionResponse = question.response.find((res) =>
        res.userID.equals(userID)
      );
      if (userQuestionResponse) {
        userQuestionResponse.response = userResponse;
        userQuestionResponse.review = false;
        userQuestionResponse.createdAt = new Date();
      } else {
        question.response.push({
          userID: userID,
          response: userResponse,
          isCorrect: isCorrect,
          review: false,
          createdAt: new Date(),
        });
      }
      if (!isDraft) {
        question.checkAndSetCorrect(userID);
      }
      // console.log('yhe hai apke responses',question);
      await question.save();
      res.status(200).json({ message: "Response Added" });
    }
  } catch (err) {
    res.send(err);
  }
};

const markforReviewTest = async (req, res, next) => {
  const userID = req.user.userID;
  const testId = req.params.testid;
  const isDraft = req.params.draft === "draft";

  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    if (req.user.userRole !== "student") {
      return res.status(403).json({ error: "Only students can submit test." });
    }
    const userIsSubmit = test.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res.status(400).json({ error: "Test is already submitted." });
    }
    const questionId = req.body.Q_id;
    const question = await QuestionData.findOne({ _id: questionId });
    if (question) {
      const userQuestionResponse = question.response.find((res) =>
        res.userID.equals(userID)
      );
      if (userQuestionResponse) {
        if (userQuestionResponse.review == false) {
          userQuestionResponse.review = true;
        } else {
          userQuestionResponse.review = false;
        }
      } else {
        question.response.push({
          userID: userID,
          review: true,
          createdAt: new Date(),
        });
      }
      if (!isDraft) {
        question.checkAndSetCorrect(userID);
      }
      await question.save();
      res.status(200).json({ message: "marked for review" });
    }
  } catch (err) {
    res.send(err);
  }
};

const clearTestResponse = async (req, res, next) => {
  const userID = req.user.userID;
  const testId = req.params.testId;
  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }
    if (req.user.userRole !== "student") {
      return res.status(403).json({ error: "Only students can submit Test." });
    }
    const userIsSubmit = test.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res.status(400).json({ error: "Test is already submitted." });
    }
    const questionId = req.body.Q_id;
    const question = await QuestionData.findOne({ _id: questionId });
    if (question) {
      const userQuestionResponse = question.response.find((res) =>
        res.userID.equals(userID)
      );
      if (userQuestionResponse) {
        userQuestionResponse.response = -1;
      }
      // console.log('apka clear question',question);
      await question.save();
      res.status(200).json({ messsage: "cleared response successfully" });
    }
  } catch (err) {
    res.send(err);
  }
};

const assignmentResponse = async (req, res, next) => {
  const { userID, userRole } = req.user;
  const { classid, assignmentid } = req.params;

  // let userResponse;

  // console.log(classid, assignmentid)
  try {
    const classroom = await Classroom.findById(classid);
    const assignment = await Assignment.findById(assignmentid);

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    // console.log(userID)

    let responseArray = [];
    let pending = [];
    let score = 0;
    let userName = "";
    let userSubmitTime = "";

    const strength = classroom.members.length;

    if (userRole === "teacher") {
      const isSubmitArray = assignment.isSubmit;

      for (let i = 0; i < isSubmitArray.length; i++) {
        // Access the userID for the current element
        const userid = isSubmitArray[i].userID;

        const user = await User.findById(userid);

        if (user) {
          userName = user.firstName;
        }

        const submitTimeArray = assignment.submitTime;
        // Find the submitTime associated with the user
        userSubmitTime = submitTimeArray.find(
          (submit) => submit.userID.toString() === userid.toString()
        );
        // console.log("chal raha hai")
        for (let i = 0; i < assignment.questionData.length; i++) {
          const question_id = assignment.questionData[i].toString();
          // console.log("this is questionID")
          // console.log(question_id)
          const question = await QuestionData.findById(question_id);
          // console.log(question)
          const userQuestionResponse = question.response.find((res) =>
            res.userID.equals(userid)
          );
          // console.log(userQuestionResponse)
          if (userQuestionResponse) {
            if (userQuestionResponse.isCorrect == true) {
              // console.log(userQuestionResponse.isCorrect)
              score = score + 1;
            }
          }
        }

        let userlist = [];
        let isSubmitArray_ids = [];
        userlist = classroom.members.map((obj) => obj._id);
        isSubmitArray_ids = assignment.isSubmit.map((obj) => obj.userID);

        // Pending Array
        let pending_ids = [];
        for (let i = 0; i < userlist.length; i++) {
          const tempUserID = userlist[i].toString();
          // console.log("tempuserID")
          // console.log(tempUserID)

          for (let j = 0; j < isSubmitArray_ids.length; j++) {
            const temp_id = isSubmitArray_ids[j].toString();
            // console.log("temp_id")
            // console.log(temp_id)
            if (temp_id !== tempUserID) {
              pending_ids.push(tempUserID);
            }
          }
        }
        // console.log("pending_ids")
        // console.log(pending_ids)
        let pendingResponse = {};

        // console.log("shuru hua")
        if (pending_ids.length > 0) {
          for (let i = 0; i < pending_ids.length; i++) {
            const fetched_user = await User.findById(pending_ids[i]);
            // console.log("mere baad error hai")
            const name = fetched_user.firstName;
            if (name) {
              pendingResponse = {
                name: name,
              };
            }
            // console.log("execute hua hu")
            pending.push(pendingResponse);
          }
        }
        // console.log("khatam ho gaya")
      }

      const responseObject = {
        name: userName,
        score: score,
        submittedOn: userSubmitTime,
        performance: "yet to find",
      };

      responseArray.push(responseObject);
    }

    const assignmentData = {
      _id: assignment._id,
      title: assignment.title,
      createdAt: assignment.createdAt,
      instruction: assignment.instruction,
      Deadline: assignment.Deadline,
      strength: strength,
      total_submission: assignment.isSubmit.length,
      pending_submission: strength - assignment.isSubmit.length,
      responses: responseArray,
      pending: pending,
    };

    res.send(assignmentData);
  } catch (err) {
    res.send(err);
  }
};

const FetchQuestionsByChapter = async (req, res) => {
  const { classid, chapterID, topicid } = req.params;
  const userRole = req.user.userRole;
  try {
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res
        .status(404)
        .json({ error: "Classroom not found in the TestController " });
    }

    const chapter = await Chapter.findById(chapterID).populate({
      path: "topicsArray",
      populate: {
        path: "extractedQuestions",
        model: "QuestionData",
      },
    });

    if (!chapter) {
      return res
        .status(404)
        .json({ error: "Chapter not found in the TestController " });
    }

    let questions = [];

    if (topicid) {
      const topic = chapter.topicsArray.find(
        (topic) => topic._id.toString() === topicid
      );
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      questions = topic.extractedQuestions.map((question) => ({
        ...question.toObject(),
        topicName: topic.topicName,
      }));
    } else {
      chapter.topicsArray.forEach((topic) => {
        const topicQuestions = topic.extractedQuestions.map((question) => ({
          ...question.toObject(),
          topicName: topic.topicName,
        }));
        questions = questions.concat(topicQuestions);
      });
    }

    return res.status(200).json({ questions });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Failed to fetch questions in the test controller" });
  }
};

const submitStudentTest = async (req, res) => {
  console.log("submitStudentTest Controller");
  const userID = req.user.userID;
  const classroomId = req.params.classid;
  const testId = req.params.testid;
  const isDraft = req.params.draft === "draft";
  const { answers } = req.body;

  try {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res
        .status(404)
        .json({ error: "Classroom not found in the TestController" });
    }

    const test = await Test.findById(testId).populate("questionData");
    if (!test) {
      return res
        .status(404)
        .json({ error: "Test not found in the TestController" });
    }

    if (req.user.userRole !== "student") {
      return res.status(403).json({ error: "Only students can submit test." });
    }

    // Check if the user has already submitted
    console.log("Checking.. if the user has already submitted")
    let userIsSubmit = false;
    if (test.isSubmit.length > 0) {
      for (let i = 0; i < test.isSubmit.length; i++) {
        if (test.isSubmit[i].userID.equals(userID)) {
          userIsSubmit = true;
          return res.status(400).json({ error: "Test is already submitted." });
        }
      }
    }

    let score = 0;
    const questionResults = test.questionData.map((question, index) => {
      console.log("question: ",question);
      console.log("index: ",index);
      const attemptedAnswerIndex = answers[index].response;
      console.log(question.answerKey, attemptedAnswerIndex);

      let isCorrect;
      if (attemptedAnswerIndex === -1) {
        isCorrect = "notAttempted";
      } else {
        isCorrect =
          question.answerKey === attemptedAnswerIndex ? "true" : "false";
        if (isCorrect === "true") {
          score += 1;
        }
      }
      return {
        questionID: question._id,
        isCorrect: isCorrect,
        attemptedAnswerIndex: attemptedAnswerIndex,
      };
    });

    console.log("Score: ",score);

    if (!isDraft) {
      if (
        userIsSubmit === undefined ||
        userIsSubmit === null ||
        userIsSubmit === false
      ) {
        test.isSubmit.push({
          userID: userID,
          isSubmit: true,
        });
      } else {
        userIsSubmit.isSubmit = true;
      }

      test.submitTime.push({
        userID: userID,
        submitTime: Date.now(),
      });

      test.submissions.push({
        userID: userID,
        score,
        questionResult: questionResults,
        submitTime: new Date(),
      });

      await test.save();

      if (test.isScheduled && test.isSubmit.length >= 4) {
        await effiencyCalculator(test, classroomId);
      }
    }

    res
      .status(200)
      .json({ success: true, score, message: "Test submitted successfully" });
  } catch (error) {
    console.log("Error present in the submitStudent Test controller", error);
    res
      .status(500)
      .json({ error: "An error occurred while submitting the test." });
  }
};

const getStudentResult = async (req, res) => {
  const userID = req.user.userID;
  const testId = req.params.testid;
  const ClassroomId = req.params.classid;

  try {
    const classroom = await Classroom.findById(ClassroomId);
    if (!classroom) {
      return res.status(404).json({
        error:
          "Classroom not found in the TestController for getting test of student",
      });
    }

    const test = await Test.findById(testId).populate({
      path: "questionData",
      populate: {
        path: "response.userID",
        model: "User",
      },
    });

    console.log(test);

    if (!test) {
      return res.status(404).json({
        error:
          "Test not found in the TestController for getting test of student",
      });
    }

    const submission = test.submissions.find((sub) =>
      sub.userID.equals(userID)
    );
    if (!submission) {
      return res
        .status(404)
        .json({ error: "Submission not found for this student." });
    }
    const studentResponse = test.questionData.map((question) => {
      const questionResult = submission.questionResult.find((qr) =>
        qr.questionID.equals(question._id)
      );
      return {
        questionID: question._id,
        question: question.content,
        options: question.options,
        correctAnswer: question.options[question.answerKey],
        studentAnswer:
          questionResult.attemptedAnswerIndex !== -1
            ? question.options[questionResult.attemptedAnswerIndex]
            : null,
        isCorrect: questionResult && questionResult.isCorrect,
      };
    });
    const score = submission.score;
    res.status(200).json({ success: true, score, response: studentResponse });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while getting the test of student." });
  }
};

const getResultForTeacher = async (req, res) => {
  const testId = req.params.testid;
  const classroomId = req.params.classid;

  try {
    const classroom = await Classroom.findById(classroomId).populate(
      "members.id",
      "-refreshToken -__v -createdAt -classroomsArray -joinRequests"
    );
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found." });
    }

    const allStudents = classroom.members.map((member) => ({
      _id: member.id._id,
      email: member.id.email,
      userRole: member.id.userRole,
      firstName: member.id.firstName,
      lastName: member.id.lastName,
    }));

    const test = await Test.findById(testId)
      .populate({
        path: "submissions.userID",
        select: "email userRole firstName lastName",
      })
      .populate({
        path: "submissions.questionResult.questionID",
        select: "content options topic chapter difficulty answerKey",
        populate: {
          path: "topic",
          model: "Topic",
          select: "topicName",
        },
      });

    if (!test) {
      return res.status(404).json({ error: "Test not found." });
    }

    const questions = [];
    const questionMap = new Map();

    test.submissions.forEach((submission) => {
      submission.questionResult.forEach((qr) => {
        if (!questionMap.has(qr.questionID._id.toString())) {
          questionMap.set(qr.questionID._id.toString(), {
            _id: qr.questionID._id,
            difficulty: qr.questionID.difficulty,
            content: qr.questionID.content,
            options: qr.questionID.options,
            answerKey: qr.questionID.answerKey,
            topic: {
              _id: qr.questionID.topic._id,
              topicName: qr.questionID.topic.topicName,
            },
            chapter: qr.questionID.chapter,
          });
        }
      });
    });

    questionMap.forEach((question) => questions.push(question));

    const responses = test.submissions.flatMap((submission) =>
      submission.questionResult.map((qr) => ({
        userID: submission.userID._id,
        userName: `${submission.userID.firstName} ${submission.userID.lastName}`,
        questionID: qr.questionID._id,
        isCorrect: qr.isCorrect,
        attemptedAnswerIndex:
          qr.attemptedAnswerIndex !== -1 ? qr.attemptedAnswerIndex : null,
      }))
    );

    const studentScores = test.submissions.map((submission) => ({
      userID: submission.userID._id,
      userName: `${submission.userID.firstName} ${submission.userID.lastName}`,
      score: submission.score,
    }));

    const result = {
      allStudents,
      questions,
      responses,
      studentScores,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while getting the test results." });
  }
};

module.exports = {
  testMetaData,
  addTestToClassroom,
  getTest,
  submitTest,
  submitTestResponse,
  markforReviewTest,
  clearTestResponse,
  fetchAllTests,
  assignmentResponse,
  FetchQuestionsByChapter,
  submitStudentTest,
  getStudentResult,
  getResultForTeacher,
};
