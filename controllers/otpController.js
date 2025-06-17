const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set OTP expiration time (e.g., 10 minutes)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP to email
    const message = `Your OTP for quiz verification is: ${otp}`;
    await sendEmail({
      email: user.email,
      subject: 'Quiz Verification OTP',
      message,
    });

    res.status(200).json({ message: 'OTP sent to your email' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // OTP is valid, clear it and allow quiz attempt
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};