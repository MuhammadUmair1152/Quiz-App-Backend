const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Result = require('../models/Result');
const Assignment = require('../models/Assignment');
const { encryptString, decryptString } = require('../utils/encryption');

// Helper to encrypt an array of question objects -- hoisted function declaration
function encryptQuestions(questions = []) {
  return questions.map((q) => ({
    questionText: encryptString(q.questionText),
    answerOptions: q.answerOptions.map((opt) => encryptString(opt)),
    correctAnswer: encryptString(q.correctAnswer),
  }));
}

// Helper to decrypt an array of question objects -- hoisted function declaration
function decryptQuestions(questions = []) {
  return questions.map((q) => {
    const safeDecrypt = (val) => {
      try {
        return decryptString(val);
      } catch (err) {
        // If decryption fails (legacy plain text), return original value
        return val;
      }
    };
    return {
      _id: q._id, // Preserve Mongo _id for reference when grading
      questionText: safeDecrypt(q.questionText),
      answerOptions: q.answerOptions.map((opt) => safeDecrypt(opt)),
      correctAnswer: safeDecrypt(q.correctAnswer),
    };
  });
}

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
      questions: encryptQuestions(questions), // Encrypted questions
      createdBy: teacherId,
    });

    const quiz = await newQuiz.save();

    // Return decrypted version so front-end can show questions without exposing encryption string
    const quizObj = quiz.toObject();
    quizObj.questions = decryptQuestions(quizObj.questions);

    res.status(201).json(quizObj);
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

    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to assign this quiz' });
    }

    // Remove duplicate IDs to avoid multiple assignments
    const uniqueStudentIds = [...new Set(studentIds.map(String))];

    // Build bulk operations to upsert assignments (avoid duplicates)
    const bulkOps = uniqueStudentIds.map((sid) => ({
      updateOne: {
        filter: { quiz: quizId, student: sid },
        update: { quiz: quizId, student: sid, assignedBy: req.user.id },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Assignment.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: 'Quiz assigned successfully' });
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

    // All assignments
    const assignments = await Assignment.find({ student: studentId })
      .populate('quiz')
      .populate('assignedBy', 'fullName ');

    // Get ids of quizzes already completed
    const completedIds = await Result.find({ student: studentId }).distinct('quiz');
    const completedSet = new Set(completedIds.map((id) => String(id)));

    const quizzesArr = assignments
      .filter((a) => !completedSet.has(String(a.quiz._id)))
      .filter((a) => a.quiz) // ensure quiz exists
      .map((a) => ({ quiz: a.quiz, teacher: a.assignedBy }));

    res.status(200).json({ assignedQuizzes: quizzesArr });
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
    const { studentAnswers } = req.body; // Array of selected option indexes

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Decrypt quiz questions
    const decrypted = decryptQuestions(quiz.questions);
    const questions = decrypted;

    let correctAnswers = 0;
    const detailedResults = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const selectedIndex = studentAnswers[i];

      // Validate index
      if (selectedIndex === undefined || selectedIndex < 0 || selectedIndex >= question.answerOptions.length) {
        // If invalid or unanswered
        detailedResults.push({
          question: question.questionText,
          studentAnswer: null,
          correctAnswer: question.correctAnswer,
          isCorrect: false,
        });
        continue;
      }

      const selectedAnswer = question.answerOptions[selectedIndex];
      const isCorrect = selectedAnswer === question.correctAnswer;

      if (isCorrect) correctAnswers++;

      detailedResults.push({
        question: question.questionText,
        studentAnswer: selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });
    }

    const percentage = (correctAnswers / questions.length) * 100;
    const score = correctAnswers;

    // Prepare studentAnswers for DB - only include answered questions
    const answerDocs = questions
      .map((q, idx) => {
        const selectedIndex = studentAnswers[idx];
        if (selectedIndex !== undefined && selectedIndex >= 0 && selectedIndex < q.answerOptions.length) {
          return {
            questionId: q._id,
            chosenAnswer: q.answerOptions[selectedIndex],
          };
        }
        return null; // Mark unanswered questions as null for filtering
      })
      .filter(answer => answer !== null); // Remove unanswered questions

    const newResult = new Result({
      quiz: quizId,
      student: studentId,
      studentAnswers: answerDocs,
      score,
      percentage,
      details: detailedResults, // Optional: useful for frontend
    });

    await newResult.save();

    res.status(200).json({ message: 'Quiz attempt submitted successfully', percentage, score });
  } catch (error) {
    console.error('Error in submitQuizAttempt:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Get student results for a specific quiz
// @route   GET /api/quizzes/:id/results
// @access  Private (Teacher only)
exports.getStudentResults = async (req, res) => {
  // Deprecated: replaced by resultsController.getQuizResultsForTeacher
  return res.status(410).json({ message: 'Deprecated endpoint' });
};

// @desc    Get all quizzes created by the logged-in teacher
// @route   GET /api/quizzes
// @access  Private (Teacher only)
exports.getQuizzes = async (req, res) => {
  try {
    // In a real app, you'd get the teacher's ID from the authenticated user
    const teacherId = req.user.id;

    const quizzesDocs = await Quiz.find({ createdBy: teacherId });
    const quizzes = quizzesDocs.map((q) => {
      const obj = q.toObject();
      obj.questions = decryptQuestions(obj.questions);
      return obj;
    });

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

    quiz.questions = decryptQuestions(quiz.questions);
    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Delete a quiz
// @route DELETE /api/quizzes/:id
// @access Private (Teacher)
exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (quiz.createdBy.toString() !== teacherId)
      return res.status(401).json({ message: 'Unauthorized' });

    // Remove quiz
    await quiz.deleteOne();

    // Optionally remove assignments and results linked to this quiz
    await Assignment.deleteMany({ quiz: quizId });
    await Result.deleteMany({ quiz: quizId });

    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc Update a quiz (title, description, questions)
// @route PUT /api/quizzes/:id
// @access Private (Teacher)
exports.updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;
    const { title, description, questions } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (quiz.createdBy.toString() !== teacherId)
      return res.status(401).json({ message: 'Unauthorized' });

    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    if (questions) quiz.questions = encryptQuestions(questions);

    const updated = await quiz.save();
    const updatedObj = updated.toObject();
    updatedObj.questions = decryptQuestions(updatedObj.questions);
    res.json(updatedObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};