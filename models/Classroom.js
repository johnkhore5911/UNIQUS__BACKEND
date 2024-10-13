const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  standard: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference the User schema for the teacher who created the classroom.
    required: true,
  },
  members: [
    {
      id: {
        type: mongoose.Types.ObjectId,
        ref: 'User', // Reference the User schema for the student who is a member.      
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  curriculum_Structure: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter', // Reference the Chapter schema for the chapter details.
    }
  ],
  joinRequests: {
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: "joinrequest"
      }
    ],
    default: []
  },

  announcements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcements',
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  classroomEff: {
    type: Number
  },
  averageSpecialCareStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    averageSolvingPercentage: Number,
  }],
  averageWeakTopics: [{
    topic: String,
    averageSolvingPercentage: Number,
  }],
});

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;