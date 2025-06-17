const express = require('express');
const { sendOtp, verifyOtp } = require('../controllers/otpController');

const router = express.Router();

// @desc    Send OTP to user's email
// @route   POST /api/otp/send
// @access  Private (should be called when student attempts a quiz)
router.post('/send', sendOtp);

// @desc    Verify OTP
// @route   POST /api/otp/verify
// @access  Public (or potentially Private, depending on flow)
router.post('/verify', verifyOtp);

module.exports = router;