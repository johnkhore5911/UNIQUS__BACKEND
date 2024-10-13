const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
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
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      filename: {
        type: String,
      },
      videoType: {
        type: String,
        enum: ['upload', 'youtube'], // Set of allowed values
        required: true,
      },
      youtubeVideoId: {
        type: String, 
      },
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;