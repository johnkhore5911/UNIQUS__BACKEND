const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    topicName: {
        type: String,
        required: true
    },
    extractedQuestions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionData'
    }]
});

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
