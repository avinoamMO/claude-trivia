export interface User {
  sessionId: string;
  name: string;
  joinedAt: string;
  streak: number;
}

export interface Question {
  _id: string;
  category: string;
  subtopic?: string;
  difficulty: number;
  question: string;
  explanation: string;
  photoUrl?: string;
  options: string[];
}

export interface SubtopicStat {
  subtopic: string;
  category: string;
  answered: number;
  correct: number;
  accuracy: number;
  maxDifficulty: number;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  deeperKnowledge?: string;
  wrongExplanation?: string;
  explanation: string;
  newAchievements?: Achievement[];
}

export interface CategoryStat {
  category: string;
  answered: number;
  correct: number;
  accuracy: number;
}

export interface LeaderboardEntry {
  name: string;
  sessionId: string;
  totalCorrect: number;
  totalAnswered: number;
  accuracy: number;
  country?: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  name: string;
  text: string;
  createdAt: string;
  system?: boolean;
}
