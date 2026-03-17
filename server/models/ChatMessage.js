const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 86400 }, // TTL: auto-delete after 24 hours
  },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
