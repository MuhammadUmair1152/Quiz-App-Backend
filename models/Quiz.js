const mongoose = require('mongoose');

const QuestionSchema = mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    answerOptions: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: String,
        required: true
    }
});

const QuizSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    questions: [QuestionSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Quiz', QuizSchema);