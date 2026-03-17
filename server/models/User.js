const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
  streak: {
    type: Number,
    default: 0,
  },
  country: {
    type: String,
    default: '',
  },
  achievements: [{
    id: String,
    earnedAt: { type: Date, default: Date.now },
  }],
});

module.exports = mongoose.model('User', userSchema);
