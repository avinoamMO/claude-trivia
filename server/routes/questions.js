const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// GET /api/questions/next — get next unanswered question for user
router.get('/next', async (req, res) => {
  try {
    const { sessionId, category, difficulty, reviewMistakes } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Review mistakes mode
    if (reviewMistakes === 'true') {
      const wrongAnswers = await Answer.find({ sessionId, correct: false }, { questionId: 1 });
      const wrongIds = wrongAnswers.map(a => a.questionId);
      if (wrongIds.length === 0) {
        return res.status(404).json({ error: 'No mistakes to review — nice work!' });
      }
      const filter = { _id: { $in: wrongIds } };
      if (category) filter.category = category;
      // Random pick from mistakes
      const count = await Question.countDocuments(filter);
      if (count === 0) return res.status(404).json({ error: 'No mistakes in this category' });
      const question = await Question.findOne(filter).skip(Math.floor(Math.random() * count));
      return res.json(safeQuestion(question));
    }

    // Get IDs of questions the user has already answered
    const answeredDocs = await Answer.find(
      { sessionId },
      { questionId: 1, answeredAt: 1, correct: 1 }
    ).sort({ answeredAt: -1 });

    const answeredIds = answeredDocs.map((a) => a.questionId);

    const filter = {};
    if (category) filter.category = category;

    if (difficulty) {
      const diff = parseInt(difficulty, 10);
      if (diff >= 1 && diff <= 5) filter.difficulty = diff;
    }

    let question = null;

    if (answeredIds.length > 0 && !difficulty) {
      // Difficulty ladder: calculate which subtopics are unlocked
      const subtopicAccuracy = await Answer.aggregate([
        { $match: { sessionId } },
        { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
        { $unwind: '$question' },
        {
          $group: {
            _id: { subtopic: '$question.subtopic', diffBucket: { $cond: [{ $lte: ['$question.difficulty', 2] }, 'low', 'high'] } },
            total: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } },
          },
        },
        { $project: { subtopic: '$_id.subtopic', diffBucket: '$_id.diffBucket', accuracy: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$correct', '$total'] }, 0] }, total: 1, _id: 0 } },
      ]);

      const lockedSubtopics = new Set();
      const subtopicLowStats = {};
      for (const row of subtopicAccuracy) {
        if (row.diffBucket === 'low' && row.subtopic) subtopicLowStats[row.subtopic] = row;
      }
      const allSubtopics = await Question.distinct('subtopic');
      for (const st of allSubtopics) {
        if (!st) continue;
        const lowStat = subtopicLowStats[st];
        if (!lowStat || lowStat.accuracy < 0.7) lockedSubtopics.add(st);
      }

      // Try weakest category first (adaptive), then any category
      if (!category) {
        const weakestCategory = await getWeakestCategory(sessionId);
        if (weakestCategory) {
          question = await findRandomLadderQuestion({ ...filter, category: weakestCategory }, answeredIds, lockedSubtopics);
        }
      }
      if (!question) {
        question = await findRandomLadderQuestion(filter, answeredIds, lockedSubtopics);
      }

      // If all ladder-appropriate answered, try ANY unanswered (random)
      if (!question) {
        question = await randomOne({ ...filter, _id: { $nin: answeredIds } });
      }

      // If ALL 351 answered, recycle the OLDEST answered one
      if (!question && answeredDocs.length > 0) {
        const oldestId = answeredDocs[answeredDocs.length - 1].questionId;
        question = await Question.findById(oldestId);
      }
    } else {
      // New user or explicit difficulty filter — random unanswered
      question = await randomOne({ ...filter, _id: { $nin: answeredIds } });
      if (!question) {
        question = await randomOne(filter);
      }
    }

    if (!question) {
      return res.status(404).json({ error: 'No questions available' });
    }

    res.json(safeQuestion(question));
  } catch (err) {
    console.error('GET /api/questions/next error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Strip answer data before sending to client
function safeQuestion(q) {
  return {
    _id: q._id, category: q.category, subtopic: q.subtopic,
    difficulty: q.difficulty, question: q.question,
    explanation: q.explanation, photoUrl: q.photoUrl, options: q.options,
  };
}

// Random document from a query
async function randomOne(filter) {
  const count = await Question.countDocuments(filter);
  if (count === 0) return null;
  return Question.findOne(filter).skip(Math.floor(Math.random() * count));
}

// Find a random unanswered question respecting the difficulty ladder
async function findRandomLadderQuestion(filter, answeredIds, lockedSubtopics) {
  const baseFilter = { ...filter, _id: { $nin: answeredIds } };

  // 1. Try locked subtopics at low difficulty (helps user progress)
  if (lockedSubtopics.size > 0) {
    const q = await randomOne({ ...baseFilter, subtopic: { $in: [...lockedSubtopics] }, difficulty: { $lte: 2 } });
    if (q) return q;
  }

  // 2. Try unlocked subtopics at any difficulty
  const q2 = await randomOne({ ...baseFilter, subtopic: { $nin: [...lockedSubtopics] } });
  if (q2) return q2;

  // 3. Legacy questions without subtopic
  return randomOne({ ...baseFilter, subtopic: { $exists: false } });
}

// GET /api/questions/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);
    res.json(categories);
  } catch (err) {
    console.error('GET /api/questions/categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: find user's weakest category
async function getWeakestCategory(sessionId) {
  const stats = await Answer.aggregate([
    { $match: { sessionId } },
    { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'question' } },
    { $unwind: '$question' },
    { $group: { _id: '$question.category', total: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } } } },
    { $project: { category: '$_id', accuracy: { $divide: ['$correct', '$total'] } } },
    { $sort: { accuracy: 1 } },
    { $limit: 1 },
  ]);
  return stats.length > 0 ? stats[0].category : null;
}

module.exports = router;
