const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    index: true,
  },
  subtopic: {
    type: String,
    index: true,
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  question: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
  photoUrl: {
    type: String,
    default: null,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length === 4,
      message: 'Options must have exactly 4 items',
    },
  },
  correctIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  deeperKnowledge: {
    type: String,
    default: '',
  },
  wrongExplanations: {
    type: Map,
    of: String,
    default: {},
  },
});

module.exports = mongoose.model('Question', questionSchema);
