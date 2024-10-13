const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
      type: Date,
      required: true
    },
    attended: {
      type: Boolean,
      required: true,
      default: true,
    }
  });
  

const StudentSchema = new mongoose.Schema({
    username:
    {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        maxlength: [20, 'Username cannot be more than 20 characters']
    },
    email:
    {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ],
    },
    firstName:
    {
        type: String,
        required: [true, 'Please add a first name'],
        trim: true,
        maxlength: [20, 'First name cannot be more than 20 characters']
    },
    lastName:
    {
        type: String,
        required: [true, 'Please add a last name'],
        trim: true,
        maxlength: [20, 'Last name cannot be more than 20 characters']
    },
    mobileno:
    {
        type: String,
        required: [true, 'Please add a mobile number'],
        unique: true,
        trim: true,
        maxlength: [10, 'Mobile number cannot be more than 10 characters']     
    },
    parents:
    {
        fatherName: String,
        motherName: String,
        fatherMobileno: String,
        motherMobileno: String,
        fatherEmail: String,
        motherEmail: String,
        guardianName: String,
        guardianMobileno: String,
    },
    class:
    {
        grade: {
            type: Number,
            required: [true, 'Please add a grade'],
            trim: true,
            maxlength: [2, 'Grade cannot be more than 2 characters'],
            min: 6,
            max: 12,

        },
        section: {
            type: String,
            required: [true, 'Please add a section'],
            trim: true,
            maxlength: [1, 'Section cannot be more than 1 character'],
            min: 'A',
            max: 'Z',
        },
        sessionofAdmission: {
            type: Number,
            required: [true, 'Please add a session of admission'],
            trim: true,
            maxlength: [4, 'Session of admission cannot be more than 4 characters'],
            min: 2000,
            max: 2100,
        }
    },
    rollno:{
        type: Number,
        required: [true, 'Please add a roll number'],
        trim: true,
        maxlength: [3, 'Roll number cannot be more than 3 characters'],
        min: 1,
        max: 999,
    },
    dateofBirth: {
        type: Date,
        required: [true, 'Please add a date of birth'],
    },
    attendance: {
        type: [attendanceSchema],
        default: []
      }
});
const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;