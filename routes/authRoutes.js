const express = require('express');
const router = express.Router();

// Placeholder controller functions
const signup = (req, res) => {
  res.send('Signup route');
};

const login = (req, res) => {
  res.send('Login route');
};

router.post('/signup', signup);
router.post('/login', login);

module.exports = router;