import type {
  User,
  Question,
  AnswerResult,
  LeaderboardEntry,
  CategoryStat,
  SubtopicStat,
  Achievement,
  ChatMessage,
} from "./types";

const API_URL = "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export function joinUser(sessionId: string, name: string) {
  return request<User>("/users/join", {
    method: "POST",
    body: JSON.stringify({ sessionId, name }),
  });
}

export function getNextQuestion(
  sessionId: string,
  category?: string,
  difficulty?: number,
  reviewMistakes?: boolean
) {
  const params = new URLSearchParams({ sessionId });
  if (category) params.set("category", category);
  if (difficulty !== undefined) params.set("difficulty", String(difficulty));
  if (reviewMistakes) params.set("reviewMistakes", "true");
  return request<Question>(`/questions/next?${params}`);
}

export function submitAnswer(
  sessionId: string,
  questionId: string,
  picked: number
) {
  return request<AnswerResult>("/answers", {
    method: "POST",
    body: JSON.stringify({ sessionId, questionId, picked }),
  });
}

export function getLeaderboard(period: "daily" | "weekly" | "allTime") {
  return request<LeaderboardEntry[]>(`/stats/leaderboard?period=${period}`);
}

export function getMyStats(sessionId: string) {
  return request<{ totalCorrect: number; totalAnswered: number; streak: number }>(
    `/stats/me?sessionId=${sessionId}`
  );
}

export function getCategoryStats(sessionId: string) {
  return request<CategoryStat[]>(
    `/stats/categories?sessionId=${sessionId}`
  );
}

export async function getCategories(): Promise<string[]> {
  const data = await request<{ category: string; count: number }[]>(
    "/questions/categories"
  );
  return data.map((d) => d.category);
}

export function getAchievements(sessionId: string) {
  return request<{ earned: Achievement[]; all: Achievement[] }>(
    `/stats/achievements?sessionId=${sessionId}`
  );
}

export function getSubtopicStats(sessionId: string) {
  return request<SubtopicStat[]>(
    `/stats/subtopics?sessionId=${sessionId}`
  );
}

export function getRecentChat() {
  return request<ChatMessage[]>("/chat/recent");
}
