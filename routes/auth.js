const express = require('express');
// const passport = require('passport');  
// require('../passport');

const router = express.Router();

const {
    login,
    register,
    forgotpassword,
    resetpassword,
    verifyEmail,     
} = require('../controllers/auth');

// Auth Routes
router.route('/verify-email').post(verifyEmail)
router.route('/register').post(register); 
router.route('/login').post(login);  
router.route('/forgotpassword').post(forgotpassword);   
router.put('/resetpassword/:resetToken', resetpassword);

// router.route('/dashboard').get(passport.authenticate('jwt', { session: false }),(req, res) => { 
//     if(req.user.role == 'admin')
//     {
//         res.send(`Welcome Admin : ${req.user}` );
//     }
//     res.send(`dashboard route :${req.user}` );
// });


module.exports = router;  
 
