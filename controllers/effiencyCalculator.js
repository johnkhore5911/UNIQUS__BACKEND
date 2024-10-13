// const dummyQuestionData = require('../dummyQuestion')
const Test = require('../models/Test')
const QuestionData = require('../models/QuestionData')
const Classroom = require('../models/Classroom')
const io = require('socket.io-client')('http://localhost:5001');

const effiencyCalculator = async (test, classroomId) => {
  const questionIds = test.questionData;
  const questions = await QuestionData.find({ _id: { $in: questionIds } });

  // Helper function to get marks based on difficulty and correctness
  function getMarks(difficulty, isCorrect) {
    if (isCorrect) {
      switch (difficulty) {
        case 'easy':
          return 1;
        case 'medium':
          return 2;
        case 'hard':
          return 4;
        default:
          return 0;
      }
    }
    return 0;
  }

  function calculateStudentMarks(submissions) {
    const studentMarks = {};

    submissions.forEach(submission => {
      submission.questionResult.forEach(result => {
        const { questionID, isCorrect } = result;
        const question = questions.find(q => q._id.equals(questionID));
        const marks = getMarks(question.difficulty, isCorrect);
        if (!studentMarks[submission.userId]) {
          studentMarks[submission.userId] = marks;
        } else {
          studentMarks[submission.userId] += marks;
        }
      });
    });

    return studentMarks;
  }

  function calculateMaxMarks(questions) {
    return questions.reduce((total, question) => {
      return total + getMarks(question.difficulty, true);
    }, 0);
  }

  function calculateStudentEfficiency(studentMarks, maxMarks) {
    const studentEfficiency = {};
    Object.entries(studentMarks).forEach(([studentID, marks]) => {
      const efficiency = (marks / maxMarks) * 100;
      studentEfficiency[studentID] = efficiency.toFixed(2); // Round to 2 decimal places
    });
    return studentEfficiency;
  }

  function calculateTestEfficiency(studentEfficiency) {
    const totalStudents = Object.keys(studentEfficiency).length;
    const totalEfficiency = Object.values(studentEfficiency).reduce((acc, curr) => acc + parseFloat(curr), 0);
    return (totalEfficiency / totalStudents).toFixed(2); // Round to 2 decimal places
  }

  function findWeakTopics(questions) {
    const topicResponses = {};

    questions.forEach(question => {
      if (question.response) {
        question.response.forEach(response => {
          const topic = question.topic;
          if (topic) {
            if (!topicResponses[topic]) {
              topicResponses[topic] = { correct: 0, incorrect: 0 };
            }
            if (response.isCorrect) {
              topicResponses[topic].correct++;
            } else {
              topicResponses[topic].incorrect++;
            }
          }
        });
      }
    });

    const weakTopics = Object.entries(topicResponses).map(([topic, responses]) => {
      const solvingPercentage = (responses.correct / (responses.correct + responses.incorrect)) * 100;
      return { topic, solvingPercentage };
    });

    weakTopics.sort((a, b) => a.solvingPercentage - b.solvingPercentage);
    return weakTopics;
  }

  function findSpecialCareStudents(studentEfficiency, testEfficiency) {
    return Object.entries(studentEfficiency).reduce((acc, [id, studentEff]) => {
      if (parseFloat(studentEff) < parseFloat(testEfficiency)) {
        acc.push({ id, studentEff });
      }
      return acc;
    }, []);
  }

  async function updateTest(testEfficiency, weakTopics, specialCareStudents, studentMarks) {
    try {
      Object.entries(studentMarks).forEach(([userID, score]) => {
        const existingScoreIndex = test.scoreArray.findIndex(entry => entry.userID.equals(userID));
        if (existingScoreIndex !== -1) {
          test.scoreArray[existingScoreIndex].score = score;
        } else {
          test.scoreArray.push({ userID, score });
        }
      });

      test.specialCareStudents = specialCareStudents;
      test.weakTopics = weakTopics;
      test.testEff = testEfficiency;

      await test.save();
    } catch (error) {
      console.error("Error while updating test model:", error);
    }
  }

  async function calculateAndUpdateClassroomEfficiency(classroomId) {
    try {
      const classroom = await Classroom.findById(classroomId);
      const testIDs = classroom.resources.test;
      const tests = await Test.find({ _id: { $in: testIDs } });

      const efficiencies = tests.map(test => test.testEff).filter(eff => eff !== undefined);
      const sum = efficiencies.reduce((total, eff) => total + parseFloat(eff), 0);
      const averageEfficiency = efficiencies.length > 0 ? sum / efficiencies.length : 0;

      const aggregatedWeakTopics = {};
      tests.forEach(test => {
        test.weakTopics.forEach(topic => {
          if (!aggregatedWeakTopics[topic.topic]) {
            aggregatedWeakTopics[topic.topic] = { totalSolvingPercentage: 0, count: 0 };
          }
          aggregatedWeakTopics[topic.topic].totalSolvingPercentage += topic.solvingPercentage;
          aggregatedWeakTopics[topic.topic].count++;
        });
      });

      const averageWeakTopics = Object.entries(aggregatedWeakTopics).map(([topic, data]) => ({
        topic,
        averageSolvingPercentage: data.totalSolvingPercentage / data.count
      }));
      averageWeakTopics.sort((a, b) => b.averageSolvingPercentage - a.averageSolvingPercentage);

      const aggregatedSpecialCareStudents = {};
      tests.forEach(test => {
        test.specialCareStudents.forEach(student => {
          const studentId = student.id;
          const solvingPercentage = student.studentEff;
          if (!aggregatedSpecialCareStudents[studentId]) {
            aggregatedSpecialCareStudents[studentId] = { totalSolvingPercentage: 0, count: 0 };
          }
          aggregatedSpecialCareStudents[studentId].totalSolvingPercentage += parseFloat(solvingPercentage);
          aggregatedSpecialCareStudents[studentId].count++;
        });
      });

      const averageSpecialCareStudents = Object.entries(aggregatedSpecialCareStudents).map(([studentId, data]) => ({
        studentId,
        averageSolvingPercentage: data.totalSolvingPercentage / data.count
      }));

      classroom.averageWeakTopics = averageWeakTopics.slice(0, 5);
      classroom.averageSpecialCareStudents = averageSpecialCareStudents.slice(0, 5);
      classroom.classroomEff = averageEfficiency;

      await classroom.save();
    } catch (error) {
      console.error("Error while calculating and updating classroom efficiency:", error);
    }
  }

  const maxMarks = calculateMaxMarks(questions);
  const studentMarks = calculateStudentMarks(test.submissions);
  const studentEfficiency = calculateStudentEfficiency(studentMarks, maxMarks);
  const testEfficiency = calculateTestEfficiency(studentEfficiency);
  const weakTopics = findWeakTopics(questions);
  const specialCareStudents = findSpecialCareStudents(studentEfficiency, testEfficiency);

  await updateTest(testEfficiency, weakTopics, specialCareStudents, studentMarks);
  await calculateAndUpdateClassroomEfficiency(classroomId);

  const timeout = setTimeout(() => {
    io.emit('effiencyCalculationDone', { classID: classroomId });
    clearTimeout(timeout);
  }, 60000);
}

module.exports = {
  effiencyCalculator
};



module.exports = effiencyCalculator;