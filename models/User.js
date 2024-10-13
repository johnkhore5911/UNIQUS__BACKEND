require('dotenv').config({ path: '../config.env' });

const mongoose = require('mongoose');
const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 5,
    select: false
  },
  userRole: {
    type: String,
    enum: ['teacher', 'student'],
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  classroomsArray: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'Classroom',
    },
  ],
  joinRequests: {
    type: [ 
      {
        type: mongoose.Types.ObjectId,
        ref: "joinrequest"
      }
    ], 
    default: []
  },
  personal_info:
  {
    contactNumber: String,   
    dateofbirth: Date,
    standard: String,
    schoolName: String,
    schoolAddress: String,
    CoachingName: String,
    CoachingAddress: String,
    ResidenceAddress: String,    
    city: String,
    state: String,
    pincode: String
  },
  refreshToken: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

const requestSchema = new mongoose.Schema({

  userID: {
    type: String,
    required: true,
  },
  classroomID: { 
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
}


UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
}

UserSchema.methods.matchPasswords = async function (password) {
  return await bcrypt.compare(password, this.password);
}


UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Request = mongoose.model('Request', requestSchema);

const User = mongoose.model('User', UserSchema);

module.exports = {
  User,
  Request
};
