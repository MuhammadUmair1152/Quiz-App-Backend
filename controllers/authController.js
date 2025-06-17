const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is in ../models/User.js

exports.signup = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Basic input validation
    if (!email || !password || !role) {
      return res.status(400).json({ msg: 'Please enter all required fields' });
    }
    if (role !== 'teacher' && role !== 'student') {
      return res.status(400).json({ msg: 'Invalid role specified' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user instance
    user = new User({
      email,
      password,
      role
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    // Respond with success message or token (optional for signup)
    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic input validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter email and password' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Generate JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Ensure JWT_SECRET is in your .env file
      { expiresIn: '1h' }, // Token expiration time
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};