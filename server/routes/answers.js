const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const { checkAchievements } = require('../achievements');

// POST /api/answers — submit an answer
router.post('/', async (req, res) => {
  try {
    const { sessionId, questionId, picked } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!questionId || typeof questionId !== 'string') {
      return res.status(400).json({ error: 'questionId is required' });
    }
    if (picked === undefined || typeof picked !== 'number' || picked < 0 || picked > 3) {
      return res.status(400).json({ error: 'picked must be a number 0-3' });
    }

    // Validate questionId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ error: 'Invalid questionId' });
    }

    // Look up the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const correct = picked === question.correctIndex;

    // Save the answer
    const answer = await Answer.create({
      sessionId,
      questionId: question._id,
      picked,
      correct,
      timeMs: req.body.timeMs || 0,
    });

    // Update user streak
    if (correct) {
      await User.findOneAndUpdate(
        { sessionId },
        { $inc: { streak: 1 }, $set: { lastSeenAt: new Date() } }
      );
    } else {
      await User.findOneAndUpdate(
        { sessionId },
        { $set: { streak: 0, lastSeenAt: new Date() } }
      );
    }

    // Build response
    const response = {
      correct,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    };

    if (correct) {
      response.deeperKnowledge = question.deeperKnowledge;
    } else {
      // Get the wrong explanation for the option the user picked
      const wrongExplanation = question.wrongExplanations
        ? question.wrongExplanations.get(String(picked))
        : null;
      response.wrongExplanation = wrongExplanation || null;
    }

    // Broadcast score update via socket
    const io = req.app.get('io');
    if (io && correct) {
      // Get updated stats for the broadcast
      const totalCorrect = await Answer.countDocuments({ sessionId, correct: true });
      const user = await User.findOne({ sessionId });
      io.emit('score:update', {
        sessionId,
        name: user ? user.name : 'Unknown',
        totalCorrect,
        streak: user ? user.streak : 0,
      });
    }

    // Check for new achievements
    const newAchievements = await checkAchievements(sessionId, question, correct);
    if (newAchievements.length > 0) {
      response.newAchievements = newAchievements;
    }

    res.json(response);
  } catch (err) {
    console.error('POST /api/answers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
