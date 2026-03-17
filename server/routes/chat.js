const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');

// GET /api/chat/recent — last 50 messages
router.get('/recent', async (req, res) => {
  try {
    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Return in chronological order (oldest first)
    res.json(messages.reverse());
  } catch (err) {
    console.error('GET /api/chat/recent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chat — send a message
router.post('/', async (req, res) => {
  try {
    const { sessionId, name, text } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required' });
    }
    if (text.trim().length > 500) {
      return res.status(400).json({ error: 'Message must be 500 characters or fewer' });
    }
    if (name.trim().length > 30) {
      return res.status(400).json({ error: 'Name must be 30 characters or fewer' });
    }

    const message = await ChatMessage.create({
      sessionId,
      name: name.trim(),
      text: text.trim(),
    });

    // Broadcast via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('chat:message', message);
    }

    res.json(message);
  } catch (err) {
    console.error('POST /api/chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
