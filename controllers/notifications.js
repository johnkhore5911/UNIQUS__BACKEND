const Classroom = require('../models/Classroom');
const {Notification} = require('../models/Notification');
const formatDateTime = require('../utils/formatDateTime');

// helper function to save the notification in the database
const saveNotifications = async (classId, msg) => {
  try {
    if (!classId) throw new Error(`Class id not found`);
    if (!msg) throw new Error(`No message provided.`);

    const classRoom = await Classroom.findById(classId);
    const className = classRoom.title

    // save the message
    const newNotification = new Notification({
      classId,
      message: `${msg} ${className} `,
    });
    await newNotification.save();

    console.log({ success: true, message: "Notification saved successfully" });
  } catch (e) {
    console.log({ success: false, error: e.message });
  }
};

const fetchNotifications = async (req, res) => {
  try {
    // getting the current time
    const { currentTime } = req.query; // MM/DD/YYYY hh:mm:ss
    if (!currentTime) throw new Error(`Start time is required`);

    // calculating last week time
    const start = new Date(currentTime);
    const lastWeekTime = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);

    // getting the notifications
    const notifications = await Notification.find({
      timestamp: { $gte: lastWeekTime, $lt: start },
    });
    if (!notifications || notifications.length == 0)
      throw new Error(`No notifications found`);

    const formattedNotifications = notifications.map(({_id, classId, message, timestamp, isRead}) => {
      return {
        id: _id,
        classId,
        message,
        timestamp: formatDateTime(timestamp),
        isRead
      }
    })

    res.json({ success: true, notifications: formattedNotifications, lastWeekTime });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
};

const markIsRead = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error(`Notification not found`);

    notification.isRead = true;
    await notification.save();
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = { saveNotifications, fetchNotifications, markIsRead };
