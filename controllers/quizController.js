const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Result = require('../models/Result');

// @desc    Create a new quiz
// @route   POST /api/quizzes/create
// @access  Private (Teacher only)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    // Basic input validation
 if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
 return res.status(400).json({ message: 'Please provide a title and at least one question for the quiz' });
    }

    // In a real app, you'd get the teacher's ID from the authenticated user
    const teacherId = req.user.id;

    const newQuiz = new Quiz({
      title,
      description,
      questions, // We'll handle encryption here later
      creator: teacherId,
    });

    const quiz = await newQuiz.save();

    res.status(201).json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Assign a quiz to students
// @route   POST /api/quizzes/:id/assign
// @access  Private (Teacher only)
exports.assignQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { studentIds } = req.body; // Array of student IDs

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
 return res.status(404).json({ message: 'Quiz not found' });
    }

    // Ensure the logged-in user is the creator of the quiz
 if (quiz.creator.toString() !== req.user.id) {
 return res.status(401).json({ message: 'Not authorized to assign this quiz' });
    }

    // In a real application, you would update student documents or create assignments here.
    res.status(200).json({ message: 'Quiz assigned successfully (placeholder)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get assigned quizzes for a student
// @route   GET /api/quizzes/assigned
// @access  Private (Student only)
exports.getAssignedQuizzes = async (req, res) => {
  try {
    const studentId = req.user.id;

    // In a real application, you would query for quizzes assigned to this student.
    // This might involve a separate Assignment model or a field in the User model.
    // For now, returning a dummy empty array.

    // Example (assuming Assignment model exists with student and quiz fields):
    res.status(200).json({ assignedQuizzes: [] }); // Return empty array for now
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Submit a quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student only)
exports.submitQuizAttempt = async (req, res) => {
  try {
    const quizId = req.params.id;
    const studentId = req.user.id;
    const { studentAnswers } = req.body; // Array of student answers

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
 return res.status(404).json({ message: 'Quiz not found' });
    }

    // In a real application, you would decrypt the quiz questions here
    const questions = quiz.questions; // Assuming questions are not encrypted for now

    let correctAnswers = 0;
    const results = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const studentAnswer = studentAnswers[i];

      const isCorrect = studentAnswer === question.correctAnswer; // Simple string comparison
      if (isCorrect) {
 correctAnswers++;
      }

      results.push({
        question: question.questionText,
        studentAnswer: studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
      });
    }

    const score = (correctAnswers / questions.length) * 100;

    const newResult = new Result({
      quiz: quizId,
      student: studentId,
      studentAnswers: studentAnswers, // Storing student's raw answers
      score: score,
    });

    await newResult.save();
    res.status(200).json({ message: 'Quiz attempt submitted successfully (placeholder)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get student results for a specific quiz
// @route   GET /api/quizzes/:id/results
// @access  Private (Teacher only)
exports.getStudentResults = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
 return res.status(404).json({ message: 'Quiz not found' });
    }

    // Ensure the logged-in user is the creator of the quiz
 if (quiz.creator.toString() !== teacherId) {
 return res.status(401).json({ message: 'Not authorized to view results for this quiz' });
    }

    res.status(200).json({ studentResults: [] }); // Return empty array for now
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all quizzes created by the logged-in teacher
// @route   GET /api/quizzes
// @access  Private (Teacher only)
exports.getQuizzes = async (req, res) => {
  try {
    // In a real app, you'd get the teacher's ID from the authenticated user
    const teacherId = req.user.id;

    const quizzes = await Quiz.find({ creator: teacherId });

    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single quiz by ID
// @route   GET /api/quizzes/:id
// @access  Private (Teacher or Student)
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // In a real app, you'd add logic here to check if the user (teacher or student)
    // is authorized to view this quiz, and decrypt questions for students.

    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};