const mongoose = require('mongoose');

const extractedQuestionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  image: {
    name: String,
    data: String,
  },
  options: [
    {
      type: String,
    },
  ],
  correctAnswerIndex: {
    type: Number,
    required: true, 
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
  },
  topic: String,
  chapter: String,
});

const ExtractedQuestion = mongoose.model('ExtractedQuestion', extractedQuestionSchema)
module.exports = ExtractedQuestion;
