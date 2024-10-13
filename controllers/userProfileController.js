const { User } = require('../models/User');


const userProfile = async (req, res, next) => {

    const userID = req.user.userID;

    try {

        const user = await User.findById(userID);

        const profileInfo = {
            fname: user.firstName,
            lname: user.lastName,
            userRole: user.userRole,
            email: user.email
        }

        res.send({profileInfo})
    
    } catch (err) {
        console.log(err)
    } 

}


const updateProfile = async (req, res, next) => {

    const userID = req.user.userID;

    const profileInfo = req.body;

    // console.log(profileInfo.mobile)
    // console.log(profileInfo.instituteName)
    // console.log(profileInfo.instituteAddress)
    // console.log(profileInfo.city)
    // console.log(profileInfo.state)
    // console.log(profileInfo.pincode)

    try {
        
        const user = await User.findById(userID)

        // console.log(user)
        // console.log(user.personal_info)

    } catch(err) {
        console.log(err)
    }

}

module.exports = {
    userProfile,
    updateProfile,
  };