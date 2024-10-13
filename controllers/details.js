const User = require("../models/User");
const Student = require("../models/Student");
const errorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");
let password;
let username;

function generatePassword() {
  let password = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 7; i++) {
    password += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return password;
}
const addstudent = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    grade,
    section,
    mobileno,
    rollno,
    sessionofAdmission,
    fatherName,
    motherName,
    fatherMobileno,
    motherMobileno,
    fatherEmail,
    motherEmail,
    guardianName,
    guardianMobileno,
    dateofBirth,
    
  } = req.body;
  username = sessionofAdmission + "0" + grade + section + rollno;
  password = generatePassword();
  try {
    const user = await User.create({
      username,
      email,
      role: "student",
      password,
    });
    // console.log(`user is created as ${user}`);
    try {
        const message = `
        <h1>Welcome ${firstName} ${lastName}</h1>
        <h1>You have been registered as a student in UNIQUS SMS</h1>
        <p>Your username is ${username} and password is ${password}</p>
        <p>Please login to your account and change your password</p>
        <p>Thank you</p>
        `;
      await sendEmail({
        to: user.email,
        subject: "Welcome to UNIQUS SMS",
        html: message,
      });
      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      return next(new errorResponse("Email could not be sent", 500));
    }
   
  } catch (error) {
    next(error);
  }
  try {
    const student = await Student.create({
      username,
      firstName,
      lastName,
      email,
      class: {
        grade,
        section,
        sessionofAdmission,
      },
      mobileno,
      rollno,
      parents: {
        fatherName,
        motherName,
        fatherMobileno,
        motherMobileno,
        fatherEmail,
        motherEmail,
        guardianName,
        guardianMobileno,
      },
        dateofBirth,
    });
    // console.log(`student is created as ${student}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
    addstudent,
}