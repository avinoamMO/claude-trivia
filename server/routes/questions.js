const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// GET /api/questions/next — get next unanswered question for user
// Implements the Learning Ladder: users must prove competence at lower difficulty
// levels before seeing higher difficulty questions in each subtopic.
router.get('/next', async (req, res) => {
  try {
    const { sessionId, category, difficulty, reviewMistakes } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Review mistakes mode: serve questions the user got wrong
    if (reviewMistakes === 'true') {
      const wrongAnswers = await Answer.find({ sessionId, correct: false }, { questionId: 1 });
      const wrongIds = wrongAnswers.map(a => a.questionId);
      if (wrongIds.length === 0) {
        return res.status(404).json({ error: 'No mistakes to review — nice work!' });
      }
      const filter = { _id: { $in: wrongIds } };
      if (category) filter.category = category;
      const question = await Question.findOne(filter).sort({ difficulty: 1 });
      if (!question) return res.status(404).json({ error: 'No mistakes in this category' });
      return res.json({
        _id: question._id, category: question.category, subtopic: question.subtopic,
        difficulty: question.difficulty, question: question.question,
        explanation: question.explanation, photoUrl: question.photoUrl, options: question.options,
      });
    }

    // Get IDs of questions the user has already answered
    const answeredDocs = await Answer.find(
      { sessionId },
      { questionId: 1, answeredAt: 1, correct: 1 }
    ).sort({ answeredAt: -1 });

    const answeredIds = answeredDocs.map((a) => a.questionId);

    // Build the query filter
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      const diff = parseInt(difficulty, 10);
      if (diff >= 1 && diff <= 5) {
        filter.difficulty = diff;
      }
    }

    let question = null;

    if (answeredIds.length > 0 && !difficulty) {
      // Difficulty ladder logic: calculate max allowed difficulty per subtopic
      // Don't serve difficulty 3+ until user has 70%+ accuracy on difficulty 1-2 in that subtopic
      const subtopicAccuracy = await Answer.aggregate([
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
            _id: {
              subtopic: '$question.subtopic',
              diffBucket: {
                $cond: [{ $lte: ['$question.difficulty', 2] }, 'low', 'high'],
              },
            },
            total: { $sum: 1 },
            correct: { $sum: { $cond: ['$correct', 1, 0] } },
          },
        },
        {
          $project: {
            subtopic: '$_id.subtopic',
            diffBucket: '$_id.diffBucket',
            accuracy: {
              $cond: [
                { $gt: ['$total', 0] },
                { $divide: ['$correct', '$total'] },
                0,
              ],
            },
            total: 1,
            _id: 0,
          },
        },
      ]);

      // Build a set of subtopics where the user has NOT yet proven low-level competence
      const lockedSubtopics = new Set();
      const subtopicLowStats = {};
      for (const row of subtopicAccuracy) {
        if (row.diffBucket === 'low' && row.subtopic) {
          subtopicLowStats[row.subtopic] = row;
        }
      }

      // Get all subtopics that have questions
      const allSubtopics = await Question.distinct('subtopic');
      for (const st of allSubtopics) {
        if (!st) continue;
        const lowStat = subtopicLowStats[st];
        // Lock if: no low-level answers yet, OR accuracy < 70%
        if (!lowStat || lowStat.accuracy < 0.7) {
          lockedSubtopics.add(st);
        }
      }

      // Adaptive: pick from user's weakest category first
      if (!category) {
        const weakestCategory = await getWeakestCategory(sessionId);
        if (weakestCategory) {
          // Try weakest category, respecting difficulty ladder
          question = await findLadderQuestion(
            { ...filter, category: weakestCategory },
            answeredIds,
            lockedSubtopics
          );
        }
      }

      // Fallback: any category, respecting difficulty ladder
      if (!question) {
        question = await findLadderQuestion(filter, answeredIds, lockedSubtopics);
      }

      // If all ladder-appropriate questions answered, try any unanswered
      if (!question) {
        question = await Question.findOne({
          ...filter,
          _id: { $nin: answeredIds },
        }).sort({ difficulty: 1 });
      }

      // If ALL questions answered, recycle oldest
      if (!question) {
        const oldestAnswered = answeredDocs[answeredDocs.length - 1];
        question = await Question.findOne({
          ...filter,
          _id: oldestAnswered.questionId,
        });
        if (!question) {
          question = await Question.findOne({ _id: oldestAnswered.questionId });
        }
      }
    } else {
      // No answers yet OR explicit difficulty filter — return matching question
      if (!category && !difficulty) {
        // New user: start with easiest
        question = await Question.findOne(filter).sort({ difficulty: 1 });
      } else {
        question = await Question.findOne({
          ...filter,
          _id: { $nin: answeredIds },
        }).sort({ difficulty: 1 });

        if (!question) {
          question = await Question.findOne(filter).sort({ difficulty: 1 });
        }
      }
    }

    if (!question) {
      return res.status(404).json({ error: 'No questions available' });
    }

    // Strip correctIndex, deeperKnowledge, and wrongExplanations — don't leak answers
    const safeQuestion = {
      _id: question._id,
      category: question.category,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      question: question.question,
      explanation: question.explanation,
      photoUrl: question.photoUrl,
      options: question.options,
    };

    res.json(safeQuestion);
  } catch (err) {
    console.error('GET /api/questions/next error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Find an unanswered question respecting the difficulty ladder
async function findLadderQuestion(filter, answeredIds, lockedSubtopics) {
  // For locked subtopics, only serve difficulty 1-2
  // For unlocked subtopics, serve any difficulty

  // Try locked subtopics first (low difficulty) — helps users progress
  if (lockedSubtopics.size > 0) {
    const lockedQuestion = await Question.findOne({
      ...filter,
      _id: { $nin: answeredIds },
      subtopic: { $in: [...lockedSubtopics] },
      difficulty: { $lte: 2 },
    }).sort({ difficulty: 1 });

    if (lockedQuestion) return lockedQuestion;
  }

  // Then try unlocked subtopics at any difficulty
  const unlockedQuestion = await Question.findOne({
    ...filter,
    _id: { $nin: answeredIds },
    subtopic: { $nin: [...lockedSubtopics] },
  }).sort({ difficulty: 1 });

  if (unlockedQuestion) return unlockedQuestion;

  // Also serve questions without a subtopic (legacy questions)
  const legacyQuestion = await Question.findOne({
    ...filter,
    _id: { $nin: answeredIds },
    subtopic: { $exists: false },
  }).sort({ difficulty: 1 });

  return legacyQuestion;
}

// GET /api/questions/categories — distinct categories with counts
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

// Helper: find user's weakest category (lowest accuracy)
async function getWeakestCategory(sessionId) {
  const stats = await Answer.aggregate([
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
        total: { $sum: 1 },
        correct: { $sum: { $cond: ['$correct', 1, 0] } },
      },
    },
    {
      $project: {
        category: '$_id',
        accuracy: { $divide: ['$correct', '$total'] },
      },
    },
    { $sort: { accuracy: 1 } },
    { $limit: 1 },
  ]);

  return stats.length > 0 ? stats[0].category : null;
}

module.exports = router;
