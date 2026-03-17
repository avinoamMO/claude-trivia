const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true,
  },
  picked: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  correct: {
    type: Boolean,
    required: true,
  },
  timeMs: {
    type: Number,
    default: 0,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for finding user's answered questions
answerSchema.index({ sessionId: 1, questionId: 1 });

module.exports = mongoose.model('Answer', answerSchema);
