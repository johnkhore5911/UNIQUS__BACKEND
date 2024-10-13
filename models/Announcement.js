const mongoose = require('mongoose');
const { User } = require('./User');

const announcementSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },

    isRead: [
        {
            userID: {
                type: mongoose.Schema.Types.ObjectId,
                ref: User,
            },
            
            isRead: {
                type: Boolean,
                default: false,
            }
        },
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    },

    classID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
    }

})


const Announcemnet = mongoose.model('Announcemnet', announcementSchema);

module.exports = {
    Announcemnet,

};