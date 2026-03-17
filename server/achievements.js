const Answer = require('./models/Answer');
const User = require('./models/User');

const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', icon: '🎯', description: 'Answer your first question correctly' },
  { id: 'getting_started', name: 'Getting Started', icon: '🚀', description: 'Answer 10 questions' },
  { id: 'scholar', name: 'Scholar', icon: '📚', description: 'Answer 50 questions' },
  { id: 'centurion', name: 'Centurion', icon: '🏆', description: 'Answer 100 questions' },
  { id: 'on_fire', name: 'On Fire', icon: '🔥', description: '5 correct in a row' },
  { id: 'unstoppable', name: 'Unstoppable', icon: '⚡', description: '10 correct in a row' },
  { id: 'perfect_run', name: 'Perfect Run', icon: '💎', description: '20 correct in a row' },
  { id: 'ladder_climber', name: 'Ladder Climber', icon: '🪜', description: 'Nail a Level 3 question' },
  { id: 'deep_thinker', name: 'Deep Thinker', icon: '🧠', description: 'Nail a Level 4 question' },
  { id: 'true_architect', name: 'True Architect', icon: '🏛️', description: 'Nail a Level 5 question' },
  { id: 'renaissance', name: 'Renaissance', icon: '🌍', description: 'Answer in all 5 domains' },
  { id: 'agentic_master', name: 'Agentic Master', icon: '🤖', description: '80%+ in Agentic Architecture (10+ answers)' },
  { id: 'tool_master', name: 'Tool Master', icon: '🔧', description: '80%+ in Tool Design & MCP (10+ answers)' },
  { id: 'config_guru', name: 'Config Guru', icon: '⚙️', description: '80%+ in Claude Code Config (10+ answers)' },
  { id: 'prompt_wizard', name: 'Prompt Wizard', icon: '✨', description: '80%+ in Prompt Engineering (10+ answers)' },
  { id: 'reliability_expert', name: 'Reliability Expert', icon: '🛡️', description: '80%+ in Context & Reliability (10+ answers)' },
];

async function checkAchievements(sessionId, question, correct) {
  const user = await User.findOne({ sessionId });
  if (!user) return [];

  const earned = (user.achievements || []).map(a => a.id);
  const newAchievements = [];

  function award(id) {
    if (!earned.includes(id)) {
      newAchievements.push(ACHIEVEMENTS.find(a => a.id === id));
      earned.push(id);
    }
  }

  const totalAnswered = await Answer.countDocuments({ sessionId });
  const totalCorrect = await Answer.countDocuments({ sessionId, correct: true });

  // Milestone achievements
  if (correct && totalCorrect === 1) award('first_blood');
  if (totalAnswered >= 10) award('getting_started');
  if (totalAnswered >= 50) award('scholar');
  if (totalAnswered >= 100) award('centurion');

  // Streak achievements
  const streak = user.streak;
  if (streak >= 5) award('on_fire');
  if (streak >= 10) award('unstoppable');
  if (streak >= 20) award('perfect_run');

  // Difficulty achievements
  if (correct && question.difficulty === 3) award('ladder_climber');
  if (correct && question.difficulty === 4) award('deep_thinker');
  if (correct && question.difficulty === 5) award('true_architect');

  // Renaissance: answered in all 5 domains
  if (!earned.includes('renaissance')) {
    const domains = await Answer.aggregate([
      { $match: { sessionId } },
      { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'q' } },
      { $unwind: '$q' },
      { $group: { _id: '$q.category' } },
    ]);
    if (domains.length >= 5) award('renaissance');
  }

  // Domain mastery (80%+ with 10+ answers)
  const domainMap = {
    'Agentic Architecture': 'agentic_master',
    'Tool Design & MCP': 'tool_master',
    'Claude Code Config': 'config_guru',
    'Prompt Engineering': 'prompt_wizard',
    'Context & Reliability': 'reliability_expert',
  };
  if (question.category && domainMap[question.category] && !earned.includes(domainMap[question.category])) {
    const stats = await Answer.aggregate([
      { $match: { sessionId } },
      { $lookup: { from: 'questions', localField: 'questionId', foreignField: '_id', as: 'q' } },
      { $unwind: '$q' },
      { $match: { 'q.category': question.category } },
      { $group: { _id: null, total: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } } } },
    ]);
    if (stats.length > 0 && stats[0].total >= 10 && (stats[0].correct / stats[0].total) >= 0.8) {
      award(domainMap[question.category]);
    }
  }

  // Save new achievements
  if (newAchievements.length > 0) {
    await User.findOneAndUpdate(
      { sessionId },
      { $push: { achievements: { $each: newAchievements.map(a => ({ id: a.id })) } } }
    );
  }

  return newAchievements;
}

module.exports = { ACHIEVEMENTS, checkAchievements };
