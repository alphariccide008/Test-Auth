const express = require("express")

// Api Response controller
const authController = require('../controllers/authController');
const { identifier } = require("../middlewares/identification");


const router = express.Router();

// signup Api and excvuting the function inside the auth controller 
router.post('/signup', authController.signup)
router.post('/signin', authController.signin)
router.post('/signout',identifier, authController.signout)

//sending verification code 
router.patch('/send-verification-code',identifier, authController.sendVerifcationCode)
router.patch('/verify-verification-code',identifier,  authController.verifyVerificationCode)

router.patch('/change-password',identifier,  authController.changePassword)

router.patch('/send-forgot-password-code',  authController.sendForgotPasswordCode)
router.patch('/verify-forgot-password-code',  authController.verifyForgotPasswordCode)


module.exports = router;