const mongoose = require('mongoose')
const sendEmail = require('../utils/sendEmail')

const OTPSchema = new mongoose.Schema({
    email: String,
    otp: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5
    }
})

async function sendVerificationEmail(email, otp) {
    try {
        await sendEmail({
            to: email,
            subject: `OTP Verification`,
            html: `This is your one time verification password: ${otp}. Please do not share it with anyone`
        })
    } catch (error) {
        console.log(error);
    }
}

OTPSchema.pre("save", async function (next) {
    if (this?.isNew) {
        await sendVerificationEmail(this?.email, this?.otp);
    }
    next();
});

const OTP = mongoose.model('OTP', OTPSchema)
module.exports = OTP