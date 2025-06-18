const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Assignment = require('../models/Assignment');

// @desc Get all results for the logged-in student
// @route GET /api/results/my
// @access Private (Student)
exports.getMyResults = async (req, res) => {
  try {
    const studentId = req.user.id;
    const results = await Result.find({ student: studentId })
      .populate('quiz', 'title description')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Get results of a specific quiz (teacher view)
// @route GET /api/quizzes/:id/results
// @access Private (Teacher)
exports.getQuizResultsForTeacher = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;

    // Ensure quiz belongs to teacher
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.createdBy.toString() !== teacherId)
      return res.status(401).json({ message: 'Unauthorized' });

    // Fetch all assignments for this quiz
    const assignments = await Assignment.find({ quiz: quizId }).populate('student', 'fullName email');

    // Fetch all result docs for this quiz
    const results = await Result.find({ quiz: quizId }).populate('student', 'fullName email');

    // Map studentId -> result
    const resultMap = new Map();
    results.forEach((r) => resultMap.set(String(r.student._id), r));

    const combined = assignments.map((a) => {
      const r = resultMap.get(String(a.student._id));
      if (r) {
        return {
          _id: r._id,
          student: a.student,
          percentage: r.percentage,
          score: r.score,
          status: 'completed',
        };
      }
      return {
        _id: a._id,
        student: a.student,
        percentage: null,
        score: null,
        status: 'pending',
      };
    });

    res.json(combined);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}; 