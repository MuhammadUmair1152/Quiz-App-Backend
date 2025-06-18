const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const protect = require('../middleware/authMiddleware');
const resultsController = require('../controllers/resultsController');

// @route   POST /api/quizzes/create
// @desc    Create a new quiz
// @access  Private (Teacher only)
router.post('/create', protect, quizController.createQuiz);

// @route   GET /api/quizzes/
// @desc    Get all quizzes (for teacher - quizzes they created)
// @access  Private (Teacher only)
router.get('/', protect, quizController.getQuizzes);

// @route   GET /api/quizzes/assigned
// @desc    Get assigned quizzes for a student
// @access  Private (Student only)
router.get('/assigned', protect, quizController.getAssignedQuizzes);

// @route   GET /api/quizzes/:id
// @desc    Get a single quiz by ID
// @access  Private (Teacher and Student)
router.get('/:id', protect, quizController.getQuizById);

// @route   POST /api/quizzes/:id/assign
// @desc    Assign a quiz to students
// @access  Private (Teacher only)
router.post('/:id/assign', protect, quizController.assignQuiz);

// @route   POST /api/quizzes/:id/submit
// @desc    Submit a quiz attempt
// @access  Private (Student only)
router.post('/:id/submit', protect, quizController.submitQuizAttempt);

// @route   GET /api/quizzes/:id/results
// @desc    Get student results for a quiz
// @access  Private (Teacher only)
router.get('/:id/results', protect, resultsController.getQuizResultsForTeacher);

// @route DELETE /api/quizzes/:id
// @desc Delete a quiz (teacher only)
router.delete('/:id', protect, quizController.deleteQuiz);

// Update quiz
router.put('/:id', protect, quizController.updateQuiz);

module.exports = router;