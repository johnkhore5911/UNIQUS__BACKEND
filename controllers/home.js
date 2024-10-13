const Classroom = require("../models/Classroom");
const { User } = require("../models/User");
// const errorResponse = require("../utils/errorResponse");

const home = async (req, res) => {

    const userID = req.user.userID;
    const user = await User.findById(userID)    // Fetch User
    const id = JSON.stringify(user.id)

    // Fetch Classrooms
    let classroom = []
    for (i in user.classroomsArray) {
        const classinfo = await Classroom.findById(user.classroomsArray[i])

        // Check if user a member of classroom or user is teacher who created the classroom
        const createdBy = JSON.stringify(classinfo.createdBy)

        classroom.push(classinfo)   
        // console.log("classroom")
        // console.log(classroom)
    }

    res.status(200).json({ classroom: classroom })     


}

module.exports = home;  