const mongoose = require('mongoose');

// Define the Notes_Schema schema
const notesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filePath: {
    type: String, 
    required:true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  originalname: {
    type: String,
    required:true
  },
  filename: {
    type: String,
    required:true
  }
});


const Note = mongoose.model('Note', notesSchema);

module.exports = Note;