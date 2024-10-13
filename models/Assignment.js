const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  instruction: String,
  Deadline: Date,
  isSubmit: [{
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isSubmit: Boolean
  }],
  submitTime: [{
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submitTime: Date
  }],
  onTime: [Boolean],
  questionData: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionData',
    },
  ],

  score: [{
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
  }

  ],
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
