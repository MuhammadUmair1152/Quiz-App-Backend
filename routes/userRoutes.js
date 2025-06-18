const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getStudents } = require('../controllers/userController');

// @route   GET /api/users/students
// @desc    Retrieve all students (teacher only)
// @access  Private
router.get('/students', protect, getStudents);

module.exports = router; 