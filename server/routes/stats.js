const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const User = require('../models/User');
const { ACHIEVEMENTS } = require('../achievements');

// GET /api/stats/achievements — user's achievements
router.get('/achievements', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const user = await User.findOne({ sessionId });
    if (!user) return res.json({ earned: [], all: ACHIEVEMENTS });

    const earned = (user.achievements || []).map(a => ({
      ...ACHIEVEMENTS.find(def => def.id === a.id),
      earnedAt: a.earnedAt,
    })).filter(Boolean);

    res.json({ earned, all: ACHIEVEMENTS });
  } catch (err) {
    console.error('GET /api/stats/achievements error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/leaderboard — top 20 users by correct answers
router.get('/leaderboard', async (req, res) => {
  try {
    const { period } = req.query; // daily | weekly | alltime (default)

    // Build date filter
    const matchStage = { correct: true };
    if (period === 'daily') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      matchStage.answeredAt = { $gte: startOfDay };
    } else if (period === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      matchStage.answeredAt = { $gte: startOfWeek };
    }
    // alltime: no date filter

    const leaderboard = await Answer.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$sessionId',
          totalCorrect: { $sum: 1 },
        },
      },
      { $sort: { totalCorrect: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'sessionId',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sessionId: '$_id',
          name: { $ifNull: ['$user.name', 'Unknown'] },
          totalCorrect: 1,
          streak: { $ifNull: ['$user.streak', 0] },
          country: { $ifNull: ['$user.country', ''] },
          _id: 0,
        },
      },
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error('GET /api/stats/leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/me — user's personal stats
router.get('/me', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const user = await User.findOne({ sessionId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalAnswered = await Answer.countDocuments({ sessionId });
    const totalCorrect = await Answer.countDocuments({ sessionId, correct: true });
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // Per-category breakdown
    const categories = await Answer.aggregate([
      { $match: { sessionId } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      {
        $group: {
          _id: '$question.category',
          answered: { $sum: 1 },
          correct: { $sum: { $cond: ['$correct', 1, 0] } },
        },
      },
      {
        $project: {
          category: '$_id',
          answered: 1,
          correct: 1,
          accuracy: {
            $round: [
              { $multiply: [{ $divide: ['$correct', '$answered'] }, 100] },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { category: 1 } },
    ]);

    res.json({
      sessionId,
      name: user.name,
      totalAnswered,
      totalCorrect,
      accuracy,
      streak: user.streak,
      categories,
    });
  } catch (err) {
    console.error('GET /api/stats/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/subtopics — per-subtopic mastery for a user
router.get('/subtopics', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const subtopics = await Answer.aggregate([
      { $match: { sessionId } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      { $match: { 'question.subtopic': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$question.subtopic',
          category: { $first: '$question.category' },
          answered: { $sum: 1 },
          correct: { $sum: { $cond: ['$correct', 1, 0] } },
          maxDifficulty: { $max: '$question.difficulty' },
        },
      },
      {
        $project: {
          subtopic: '$_id',
          category: 1,
          answered: 1,
          correct: 1,
          maxDifficulty: 1,
          accuracy: {
            $round: [
              { $multiply: [{ $divide: ['$correct', '$answered'] }, 100] },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { subtopic: 1 } },
    ]);

    res.json(subtopics);
  } catch (err) {
    console.error('GET /api/stats/subtopics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/categories — per-category stats for a user
router.get('/categories', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const categories = await Answer.aggregate([
      { $match: { sessionId } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      {
        $group: {
          _id: '$question.category',
          answered: { $sum: 1 },
          correct: { $sum: { $cond: ['$correct', 1, 0] } },
        },
      },
      {
        $project: {
          category: '$_id',
          answered: 1,
          correct: 1,
          accuracy: {
            $round: [
              { $multiply: [{ $divide: ['$correct', '$answered'] }, 100] },
              0,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { category: 1 } },
    ]);

    res.json(categories);
  } catch (err) {
    console.error('GET /api/stats/categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
