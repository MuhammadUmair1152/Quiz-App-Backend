const mongoose = require('mongoose');

const ResultSchema = mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  studentAnswers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      chosenAnswer: {
        type: String,
        required: true
      }
    }
  ],
  score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  dateAttempted: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Result', ResultSchema);