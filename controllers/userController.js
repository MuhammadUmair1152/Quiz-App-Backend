const User = require('../models/User');

// @desc    Get all students
// @route   GET /api/users/students
// @access  Private (Teacher only)
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}; 