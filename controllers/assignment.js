const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");
const QuestionData = require("../models/QuestionData");
const { User } = require("../models/User")
const formatDateTime = require('../utils/formatDateTime');
const Chapter = require("../models/Chapters");

const addAssignmentToClassroom = async (req, res, next) => {
  const { userID, userRole } = req.user;
  const { classid, chapterid } = req.params;
  const questionData = JSON.parse(req.body.questionData);
  const { title, deadline, instruction } = req.body;       
  const images = req.files;


  questionData.map((q, i) => {
    if (q.image) {
      images.map((img, j) => {
        if (img.originalname === q.imageName) {
          q.image = img;
        }
      })
    }
  })


  try {
    if (userRole !== "teacher") {
      return res.status(403).json({ error: "Only teachers can add assignments." });
    }
    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    if(classroom.curriculum_Structure.length == 0) {
      return res.status(404).json({message: "no curriculum found, first create a curriculum structure"})
    }
    const fetchedChapterID = classroom.curriculum_Structure.find(chapter => (chapter.equals(chapterid)));
    if(!fetchedChapterID) {
      return res.status(404).json({message: "chapter not found"})
    }
    const selectedChapter = await Chapter.findById(fetchedChapterID.toString());
    if(!selectedChapter) {
      return res.status(404).json({message: "chapter not found"})
    }

    const questions = [];
    for (const qData of questionData) {
      if (qData.image) {
        const base64Image = Buffer.from(qData.image.buffer).toString('base64');

        const question = new QuestionData({
          content: qData.questionText,
          image: {
            name: qData.imageName,
            data: base64Image
          },
          options: qData.options.map((o) => o.optionText),
          answerKey: qData.answerKey,
          response: [],
          difficulty: qData.difficulty,
          topic: qData.topic,
          chapter: qData.chapter,
        });
        await question.save();
        questions.push(question);
      } else {
        const question = new QuestionData({
          content: qData.questionText,
          options: qData.options.map((o) => o.optionText),
          answerKey: qData.answerKey,
          response: [],
          difficulty: qData.difficulty,
          topic: qData.topic,
          chapter: qData.chapter,
        });
        await question.save();
        questions.push(question);
      }
    }
    const assignment = new Assignment({
      title,
      createdBy: userID,
      questionData: questions,
      deadline,
      instruction
    });
    await assignment.save();
    selectedChapter.resources.assignment.push(assignment._id);
    await classroom.save();
    await selectedChapter.save();
    res.status(201).json({
      success: true,
      data: assignment,
    });
  }
  catch (error) {
    next(error);
  }
};

const fetchAllAssignments = async (req, res, next) => {

  const userID = req.user.userID;
  const { classid, chapterid } = req.params;
  const userRole = req.user.userRole;


  try {

    const classroom = await Classroom.findById(classid);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    const chapter = await Chapter.findById(chapterid);
    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    const assignment_ID_Array = chapter.resources.assignment;
    const AssignmentsArray = []

    for (const i in assignment_ID_Array) {
      let assignmentsInfo = {};
      const assignment = await Assignment.findById(assignment_ID_Array[i]);

      let isSubmit = false
      if (assignment) {

        const isSubmitEntry = assignment.isSubmit.find(entry => entry.userID.equals(userID));
        if (isSubmitEntry) {
          isSubmit = isSubmitEntry.isSubmit;
        }
        if (userRole === "teacher") {
          const strength = classroom.members.length;
          let submittedby = 0;
          let pending = strength;
          submittedby = assignment.isSubmit.length;
          pending = strength - submittedby;
             
          // conversion of dateTime into Date & Time format
          const formattedDateTime = formatDateTime(assignment.createdAt)
          // console.log(assignment.Deadline)
          assignmentsInfo = {
            id: assignment._id,
            title: assignment.title,   
            createdAt: formattedDateTime.date,
            submittedby: submittedby,   
            pending: pending,
            deadline: assignment.Deadline ? assignment.Deadline : "",    
          }
          AssignmentsArray.push(assignmentsInfo);
        }
        else if (userRole === "student") {
          let score = 0;  
          const total_questions = assignment.questionData.length;
          for (let i = 0; i < assignment.questionData.length; i++) {   
            const question_id = assignment.questionData[i].toString();  
            const question = await QuestionData.findById(question_id);
            const userQuestionResponse = question.response.find((res) => res.userID.equals(userID));
            if (userQuestionResponse) {
              if (userQuestionResponse.isCorrect == true) {
                score = score + 1
              }
            }
          }
  
          assignmentsInfo = {
            id: assignment._id,
            title: assignment.title,
            createdAt: assignment.createdAt,
            status: isSubmit,
            score: score,
            total: total_questions,
            deadline: assignment.Deadline ? assignment.Deadline : "" ,
          }

          AssignmentsArray.push(assignmentsInfo);      
        }
      }
    }    
    res.send({ AssignmentsArray })
  } catch (err) {
    console.log(err)
  }


}

const getAssignment = async (req, res, next) => {
  const { userID, userRole } = req.user;
  const { classid, assignmentid } = req.params;
  let userResponse;

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
    let assignmentData = {};
    const userIsSubmit = assignment.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    const userSubmitTime = assignment.submitTime.find((userStatus) =>
      userStatus.userID.equals(userID)
    );

    if (userRole === "teacher") {  
      assignmentData = {
        _id: assignment._id,
        title: assignment.title,
        createdAt: assignment.createdAt,
        instruction: assignment.instruction,
        Deadline: assignment.Deadline,
      };

      // console.log(assignmentData)
      const questionIds = assignment.questionData.map(
        (question) => question._id
      );
      // console.log(questionIds)
      const questionData = [];
      for (const questionId of questionIds) {
        const question = await QuestionData.findById(questionId).select(  
          "-response"
        );
        questionData.push(question);
      }
      // console.log(questionData)
      assignmentData.questionData = questionData;
    } else if (userRole === "student") {
      assignmentData = {
        _id: assignment._id,
        title: assignment.title,
        createdBy: assignment.createdBy,
        createdAt: assignment.createdAt,
        instruction: assignment.instruction,
        Deadline: assignment.Deadline,
        isSubmit: userIsSubmit ? userIsSubmit : false,
        submitTime: userSubmitTime ? userSubmitTime : " ",
        onTime: assignment.onTime,
      };
      // console.log(assignmentData)
      const questionIds = assignment.questionData.map(
        (question) => question._id
      );
      const questionData = [];
      for (const questionId of questionIds) {
        const question = await QuestionData.findById(questionId);   

        userResponse = question.response.find((response) =>
          response.userID.equals(userID)
        );
        questionData.push({ question, userResponse });
      }
      // console.log(questionData)
      // if there is a userResponse    
      if (userResponse) {
        if (userIsSubmit ? userIsSubmit.isSubmit : false) {
          const responseArray = questionData.map(({ question, userResponse }) => {
            return {
              _id: question._id,
              content: question.content,
              options: question.options,
              image: question.image,
              response: [
                {
                  userID: userResponse.userID,
                  response: userResponse.response,
                  isCorrect: userResponse.isCorrect,
                  createdAt: userResponse.createdAt,
                },
              ],
            };
          });
          assignmentData.questionData = responseArray;
        } else {
          const responseArray = questionData.map(({ question, userResponse }) => {
            return {
              _id: question._id,
              content: question.content,
              options: question.options,
              image: question.image,
              response: [
                {
                  userID: userResponse.userID,
                  response: userResponse.response,
                  review: userResponse.review,
                },
              ],
            };
          });
          assignmentData.questionData = responseArray;
        }
      }
      // if there is no userResponse 
      else {
        if (userIsSubmit ? userIsSubmit.isSubmit : false) {
          const responseArray = questionData.map(({ question, userResponse }) => {
            return {
              _id: question._id,
              content: question.content,
              options: question.options,
              image: question.image,
              response: [
                {
                  userID: userID,
                  response: null,
                  isCorrect: null,
                  createdAt: null,
                },
              ],
            };
          });
          assignmentData.questionData = responseArray;
        } else {
          const responseArray = questionData.map(({ question, userResponse }) => {
            return {
              _id: question._id,
              content: question.content,
              options: question.options,
              image: question.image,
              response: [
                {
                  userID: userID,
                  response: null,
                  review: null,
                },
              ],
            };
          });
          assignmentData.questionData = responseArray;
        }
      }
    }

    // console.log(assignmentData)
    res.status(200).json(assignmentData);

  } catch (error) {
    next(error);
  }
};

const submitAssignment = async (req, res, next) => {
  const userID = req.user.userID;
  const classroomId = req.params.classid;
  const assignmentId = req.params.assignmentid;
  const isDraft = req.params.draft === 'draft';
  try {
    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    if (req.user.userRole !== "student") {
      return res
        .status(403)
        .json({ error: "Only students can submit assignments." });
    }

    const userIsSubmit = assignment.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res
        .status(400)
        .json({ error: "Action not allowed, Assignment is already submitted." });
    }

    if (!isDraft) {
      if (!userIsSubmit) {
        assignment.isSubmit.push({ userID: userID, isSubmit: true });
      } else {
        userIsSubmit.isSubmit = true;
      }
      assignment.submitTime.push({
        userID: userID,
        submitTime: new Date(),
      })
      await assignment.save();
    }
    res.status(200).json({ success: true, message: "Assignment submitted successfully." });
  } catch (error) {
    next(error);
  }
};


const submitResponse = async (req, res, next) => {

  const userID = req.user.userID;
  const classroomId = req.params.classid;
  const assignmentId = req.params.assignmentid;
  const isDraft = req.params.draft === 'draft';

  // console.log({ userID, classroomId, assignmentId })

  try {
    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    if (req.user.userRole !== "student") {
      return res
        .status(403)
        .json({ error: "Only students can submit assignments." });
    }

    const userIsSubmit = assignment.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res
        .status(400)
        .json({ error: "Action not allowed, Assignment is already submitted." });
    }

    const response = req.body;
    const questionId = response.questionID;
    const userResponse = parseInt(response.response, 10);
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
          isCorrect: false,
          review: false,
          createdAt: new Date(),
        });
      }
      if (!isDraft) {
        question.checkAndSetCorrect(userID);
      }
      await question.save();
      res.status(200).json({message: "Response added Successfully"});
    }
  } catch (err) {
    res.send(err)
  }
}

const markforReview = async (req, res, next) => {

  const userID = req.user.userID;
  const assignmentId = req.params.assignmentid;
  const isDraft = req.params.draft === 'draft';

  // console.log({ userID, assignmentId })

  try {

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    if (req.user.userRole !== "student") {
      return res
        .status(403)
        .json({ error: "Only students can submit assignments." });
    }

    const userIsSubmit = assignment.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res
        .status(400)
        .json({ error: "Action not allowed, Assignment is already submitted." });
    }

    const questionId = req.body.Q_id;

    // console.log(questionId)

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
      res.status(200).json({message: "Review status updated..."})
    }

  } catch (err) {
    res.send(err)
  }
}


const clearResponse = async (req, res, next) => {

  const userID = req.user.userID;
  const assignmentId = req.params.assignmentid;

  try {

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    if (req.user.userRole !== "student") {
      return res
        .status(403)
        .json({ error: "Only students can submit assignments." });
    }

    const userIsSubmit = assignment.isSubmit.find((userStatus) =>
      userStatus.userID.equals(userID)
    );
    if (userIsSubmit && userIsSubmit.isSubmit) {
      return res
        .status(400)
        .json({ error: "Action not allowed, Assignment is already submitted." });
    }

    const questionId = req.body.Q_id;
    const question = await QuestionData.findOne({ _id: questionId });
    if (question) {
      const userQuestionResponse = question.response.find((res) =>
        res.userID.equals(userID)
      );
      if (userQuestionResponse) {
        userQuestionResponse.response = 0;
      }
      await question.save();
      res.status(200).json({message: "Response cleared..."})
    }
  } catch (err) {
    res.send(err)
  }
}

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
    let userName = ""
    let userSubmitTime = ""

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
        userSubmitTime = submitTimeArray.find(submit => submit.userID.toString() === userid.toString());
        // console.log("chal raha hai")
        for (let i = 0; i < assignment.questionData.length; i++) {

          const question_id = assignment.questionData[i].toString();
          // console.log("this is questionID")
          // console.log(question_id)
          const question = await QuestionData.findById(question_id);
          // console.log(question)
          const userQuestionResponse = question.response.find((res) => res.userID.equals(userid));
          // console.log(userQuestionResponse)
          if (userQuestionResponse) {
            if (userQuestionResponse.isCorrect == true) {
              // console.log(userQuestionResponse.isCorrect)
              score = score + 1
            }
          }  
        };

        let userlist = [];
        let isSubmitArray_ids = [];
        userlist = classroom.members.map(obj => obj._id);
        isSubmitArray_ids = assignment.isSubmit.map(obj => obj.userID);

        // Pending Array
        let pending_ids = [];
        for (let i = 0; i < userlist.length; i++) {
          const tempUserID = userlist[i].toString();
          for (let j = 0; j < isSubmitArray_ids.length; j++) {
            const temp_id = isSubmitArray_ids[j].toString()
            if (temp_id !== tempUserID) {
              pending_ids.push(tempUserID)
            }
          }
        }

        let pendingResponse = {}
        if (pending_ids.length > 0) {
          for (let i = 0; i < pending_ids.length; i++) {
            const fetched_user = await User.findById(pending_ids[i])
            const name = fetched_user.firstName;
            if (name) {
              pendingResponse = {
                name: name
              }
            }
            // console.log("execute hua hu")
            pending.push(pendingResponse);     
          }
        }
        // console.log("khatam ho gaya")

      }
      let submitDateTime = {}
      if(userSubmitTime) {
        const formattedDateTime = formatDateTime(userSubmitTime.submitTime);
        // console.log(userSubmitTime)
        // console.log(formattedDateTime.date)
        // console.log(formattedDateTime.time)
        submitDateTime = {submitDate: formattedDateTime.date, submitTime: formattedDateTime.time};   
      }

      const responseObject = {
        name: userName,
        score: score,
        submittedOn: submitDateTime,
        performance: "yet to find",
      }

      responseArray.push(responseObject)
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
    }

    res.send(assignmentData)

  } catch (err) {
    res.send(err)
  }
}

module.exports = {
  addAssignmentToClassroom,
  getAssignment,
  submitAssignment,
  submitResponse,
  markforReview,
  clearResponse,
  fetchAllAssignments,
  assignmentResponse,
};
