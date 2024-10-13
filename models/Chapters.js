const mongoose = require('mongoose');

// Define the Chapter schema
const chapterSchema = new mongoose.Schema({
  chapterTitle: {
    type: String,
    required: true
  },
  topicsArray: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic' // Reference the Topic schema for topics
    }
  ],
  isLocked: {
    type: Boolean,
    required: true,
    default: true
  },

  resources: {
    notes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note', // Reference the schema for notes if you have one.
      },
    ],
    test: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test', // Reference the schema for tests if you have one.
      },
    ],
    assignment: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment', // Reference the schema for assignments if you have one.
      },
    ],
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video', // Reference the schema for videos if you have one.
      },
    ],
  },
});

// Define the Chapter model
const Chapter = mongoose.model('Chapter', chapterSchema);

// Export the Chapter model
module.exports = Chapter;