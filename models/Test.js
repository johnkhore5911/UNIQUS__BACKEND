const mongoose = require('mongoose');

const questionResultSchema = new mongoose.Schema({
  questionID : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionData',
    required: true
  },
  isCorrect: {
    type: String,
    enum : ['true' , 'false' , 'notAttempted'],
    required: true
  },
  attemptedAnswerIndex : {
    type: Number,
    required: true
  }
});

const submissionSchema = new mongoose.Schema({
  userID : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score : {
    type: Number,
    required: true
  },
  questionResult: [questionResultSchema],
  submitTime :{
    type : Date,
    default: Date.now,
  }
})


const testSchema = new mongoose.Schema({
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
    required: true,
  },
   
  instruction: {
    type: Array,  
  }, 
    
  Deadline: {
    type: Date,
  },    
  
  isScheduled: {
    type: Boolean,
    required: true,    
    default: false
  },

  scheduledTime: {
    type: Date,
  },

  duration: {
    type: Number,
  },
    
  questionData: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionData',
    },
  ],

  // responses and parameters calculated after response submission by student
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
  specialCareStudents:[{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
  },
  studentEff: Number,
  }],
  weakTopics: [{
    topic: String,
    solvingPercentage: Number,
}],

  onTime: [Boolean],
  testEff:{
    type:Number
  },

  submissions: [submissionSchema],

  scoreArray: [
    {
      userID: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score : {     
        type: Number
      }
    }
  ] 
});

const Test = mongoose.model('Test', testSchema);
  
module.exports = Test;
