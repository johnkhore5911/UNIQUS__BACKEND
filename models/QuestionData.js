const mongoose = require('mongoose');

const questionDataSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  image: {
    name: String,
    data: String
  },
  options: [
    {
      type: String,
    },
  ],
  answerKey: {
    type: Number,
    required: true, 
  },
  response: [
    {
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },   
      response: Number,   
      isCorrect: Boolean,   
      review: Boolean,
      createdAt: Date,   
    },
  ],
  review: {
    type: Boolean,
    default: false, // Set review to false by default
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
  },
  topic: String,
  chapter: String,
});

questionDataSchema.methods.checkAndSetCorrect = function (user_id) {
  const userResponse = this.response.find(response => response.userID.equals(user_id));

  if (userResponse) {
    if (userResponse.response === this.answerKey) {
      userResponse.isCorrect = true;
    }
  }
};

const QuestionData = mongoose.model('QuestionData', questionDataSchema)
module.exports = QuestionData
