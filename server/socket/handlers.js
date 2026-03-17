const ChatMessage = require('../models/ChatMessage');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins — broadcast system message
    socket.on('user:join', async (data) => {
      const { sessionId, name } = data || {};
      if (!name || !sessionId) return;

      const trimmedName = String(name).trim().slice(0, 30);

      // Save a system message to chat
      const systemMessage = await ChatMessage.create({
        sessionId: 'system',
        name: 'System',
        text: `${trimmedName} joined the trivia!`,
      });

      io.emit('chat:message', systemMessage);
      console.log(`User joined: ${trimmedName} (${sessionId})`);
    });

    // Chat message — save + broadcast
    socket.on('chat:message', async (data) => {
      const { sessionId, name, text } = data || {};

      if (!sessionId || !name || !text) return;
      if (typeof text !== 'string' || text.trim().length === 0) return;
      if (text.trim().length > 500) return;

      const trimmedName = String(name).trim().slice(0, 30);
      const trimmedText = text.trim().slice(0, 500);

      try {
        const message = await ChatMessage.create({
          sessionId,
          name: trimmedName,
          text: trimmedText,
        });

        io.emit('chat:message', message);
      } catch (err) {
        console.error('Socket chat:message error:', err);
      }
    });

    // Score update — broadcast to all
    socket.on('score:update', (data) => {
      io.emit('score:update', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocketHandlers;
