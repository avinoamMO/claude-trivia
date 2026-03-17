import { useState, useEffect, useCallback } from "react";
import { Check, X, ChevronRight, Loader2, Flame, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { getNextQuestion, submitAnswer, getCategories, getCategoryStats } from "../lib/api";
import type { Question, AnswerResult, Achievement, CategoryStat } from "../lib/types";
import GlossaryText from "./GlossaryText";

interface QuizProps {
  sessionId: string;
}

const difficultyLabel = (d: number) => {
  const labels: Record<number, string> = { 1: "What is this?", 2: "How does it work?", 3: "What's wrong here?", 4: "Why did it break?", 5: "Architect it" };
  return labels[d] || "Unknown";
};

const difficultyColor = (d: number) => {
  const colors: Record<number, string> = { 1: "text-emerald-400", 2: "text-sky-400", 3: "text-yellow-400", 4: "text-orange-400", 5: "text-red-400" };
  return colors[d] || "text-zinc-400";
};

const subtopicEmoji: Record<string, string> = {
  "1.1 Agentic Loops": "🔄", "1.2 Multi-Agent Orchestration": "🎭", "1.3 Subagent Invocation & Context": "🧩",
  "1.4 Workflow Enforcement & Handoff": "📋", "1.5 Agent SDK Hooks": "🪝", "1.6 Task Decomposition": "🔨",
  "1.7 Session State & Resumption": "💾", "2.1 Tool Interface Design": "🔧", "2.2 Structured Error Responses": "⚠️",
  "2.3 Tool Distribution & tool_choice": "📦", "2.4 MCP Server Integration": "🌐", "2.5 Built-in Tools": "🛠️",
  "3.1 CLAUDE.md Hierarchy": "📄", "3.2 Custom Slash Commands & Skills": "⌨️", "3.3 Path-Specific Rules": "📁",
  "3.4 Plan Mode vs Direct Execution": "📐", "3.5 Iterative Refinement": "🔁", "3.6 CI/CD Integration": "🚀",
  "4.1 Explicit Criteria": "✅", "4.2 Few-Shot Prompting": "📝", "4.3 Structured Output with tool_use": "📊",
  "4.4 Validation-Retry Loops": "🔄", "4.5 Batch Processing": "📦", "4.6 Multi-Instance Review": "👥",
  "5.1 Context Preservation": "🧠", "5.2 Escalation & Ambiguity": "❓", "5.3 Error Propagation": "💥",
  "5.4 Codebase Exploration": "🔍", "5.5 Human Review & Confidence": "👤", "5.6 Information Provenance": "📌",
};

function fireConfetti() {
  confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ["#D97757", "#E8956F", "#22c55e", "#3b82f6", "#fbbf24"] });
}

export default function Quiz({ sessionId }: QuizProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | undefined>(undefined);
  const [reviewMode, setReviewMode] = useState(false);
  const [toast, setToast] = useState<Achievement | null>(null);
  const [toastExiting, setToastExiting] = useState(false);

  // Session score tracking
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [streak, setStreak] = useState(0);

  const showToast = (achievement: Achievement) => {
    setToast(achievement);
    setToastExiting(false);
    setTimeout(() => { setToastExiting(true); setTimeout(() => setToast(null), 300); }, 3000);
  };

  const fetchQuestion = useCallback(async () => {
    setLoadingQuestion(true);
    setResult(null);
    setPicked(null);
    try {
      const q = await getNextQuestion(sessionId, selectedCategory || undefined, selectedDifficulty, reviewMode);
      setQuestion(q);
    } catch { setQuestion(null); }
    finally { setLoadingQuestion(false); }
  }, [sessionId, selectedCategory, selectedDifficulty, reviewMode]);

  useEffect(() => { fetchQuestion(); }, [fetchQuestion]);
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getCategoryStats(sessionId).then(setCategoryStats).catch(() => {});
  }, [sessionId]);

  const refreshStats = () => getCategoryStats(sessionId).then(setCategoryStats).catch(() => {});

  const handleAnswer = async (index: number) => {
    if (result || !question || submitting) return;
    setPicked(index);
    setSubmitting(true);
    try {
      const res = await submitAnswer(sessionId, question._id, index);
      setResult(res);
      setSessionTotal(prev => prev + 1);
      if (res.correct) {
        setSessionCorrect(prev => prev + 1);
        setStreak(prev => {
          const newStreak = prev + 1;
          // Auto-increase difficulty after 3 correct in a row
          if (newStreak > 0 && newStreak % 3 === 0) {
            setSelectedDifficulty(curr => {
              if (curr === undefined) return 2;
              return curr < 5 ? curr + 1 : curr;
            });
          }
          return newStreak;
        });
        fireConfetti();
      } else {
        setStreak(0);
      }
      refreshStats();
      if (res.newAchievements && res.newAchievements.length > 0) showToast(res.newAchievements[0]);
    } catch { setPicked(null); }
    finally { setSubmitting(false); }
  };

  const getCategoryProgress = (cat: string) => {
    const stat = categoryStats.find(s => s.category === cat);
    return stat ? stat.accuracy : 0;
  };

  const sessionAccuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

  if (loadingQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#D97757]" />
          <p>Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <p className="text-lg mb-2">{reviewMode ? "No mistakes to review!" : "No questions available"}</p>
          {reviewMode && <p className="text-sm text-emerald-400 mb-4">You're doing great!</p>}
          <div className="flex gap-3 justify-center">
            {reviewMode && (
              <button onClick={() => { setReviewMode(false); }} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white rounded-lg transition-colors cursor-pointer">
                Back to Quiz
              </button>
            )}
            <button onClick={fetchQuestion} className="px-4 py-2 bg-[#D97757] hover:bg-[#E8956F] text-white rounded-lg transition-colors cursor-pointer">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const emoji = question.subtopic ? subtopicEmoji[question.subtopic] || "📖" : "📖";

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto relative">
      {/* Achievement toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${toastExiting ? 'toast-exit' : 'toast-enter'}`}>
          <div className="bg-[#2a2a2a] border border-[#D97757]/40 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
            <span className="text-2xl">{toast.icon}</span>
            <div>
              <p className="text-[#D97757] font-semibold text-sm">Achievement Unlocked!</p>
              <p className="text-white text-xs">{toast.name} — {toast.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Session score bar */}
      <div className="flex items-center gap-4 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Score</span>
          <span className="text-sm font-semibold text-white">{sessionCorrect}/{sessionTotal}</span>
          {sessionTotal > 0 && (
            <span className={`text-xs font-medium ${sessionAccuracy >= 70 ? 'text-emerald-400' : sessionAccuracy >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {sessionAccuracy}%
            </span>
          )}
        </div>
        {streak > 1 && (
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400">{streak} streak</span>
          </div>
        )}
        {reviewMode && (
          <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">Reviewing Mistakes</span>
        )}
        <div className="flex-1" />
        {/* Difficulty toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 mr-1">Level</span>
          {[1, 2, 3, 4, 5].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(selectedDifficulty === d ? undefined : d)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                selectedDifficulty === d ? `${difficultyColor(d)} bg-white/10 ring-1 ring-current` : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
              }`}
              title={difficultyLabel(d)}
            >
              {d}
            </button>
          ))}
        </div>
        {/* Review mistakes button */}
        <button
          onClick={() => setReviewMode(!reviewMode)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
            reviewMode ? "bg-red-500/20 text-red-400" : "bg-[#2a2a2a] text-zinc-500 hover:text-zinc-300"
          }`}
          title="Review questions you got wrong"
        >
          <RotateCcw className="w-3 h-3" />
          Retry Weak
        </button>
      </div>

      {/* Category filter — progress-filled bubbles */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            selectedCategory === "" ? "bg-[#D97757] text-white" : "bg-[#2a2a2a] text-zinc-400 hover:text-white"
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const progress = getCategoryProgress(cat);
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`relative px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer overflow-hidden ${
                isSelected ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
              style={{ background: isSelected ? '#D97757' : '#2a2a2a' }}
            >
              {!isSelected && progress > 0 && (
                <div className="absolute inset-y-0 left-0 bg-[#D97757]/20 rounded-full" style={{ width: `${progress}%` }} />
              )}
              <span className="relative">{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Compact subtopic + difficulty bar */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-lg">{emoji}</span>
        <span className="text-xs text-zinc-500">{question.category}</span>
        <span className="text-zinc-700">&middot;</span>
        <span className="text-xs text-zinc-400">{question.subtopic}</span>
        <span className="ml-auto">
          <span className={`text-xs font-medium ${difficultyColor(question.difficulty)}`}>
            {difficultyLabel(question.difficulty)} {"*".repeat(question.difficulty)}
          </span>
        </span>
      </div>

      {/* Question card */}
      <div className="bg-[#232323] border border-[#333] rounded-xl p-6 mb-4">
        <h2 className="text-xl font-semibold text-white mb-3">
          <GlossaryText text={question.question} />
        </h2>
        {question.explanation && (
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            <GlossaryText text={question.explanation} />
          </p>
        )}

        {/* Options with inline feedback */}
        <div className="grid gap-3">
          {question.options.map((option, idx) => {
            let style = "bg-[#1a1a1a] border-[#3a3a3a] hover:border-[#D97757]/50 hover:bg-[#1e1e1e] text-zinc-200";
            let feedbackText = "";
            let feedbackType: "correct" | "wrong" | "" = "";

            if (result) {
              if (idx === result.correctIndex) {
                style = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300";
                if (result.deeperKnowledge) { feedbackText = result.deeperKnowledge; feedbackType = "correct"; }
              } else if (idx === picked && !result.correct) {
                style = "bg-red-500/10 border-red-500/50 text-red-300";
                if (result.wrongExplanation) { feedbackText = result.wrongExplanation; feedbackType = "wrong"; }
              } else {
                style = "bg-[#1a1a1a]/50 border-[#2a2a2a] text-zinc-600";
              }
            } else if (idx === picked) {
              style = "bg-[#D97757]/10 border-[#D97757]/50 text-[#E8956F]";
            }

            return (
              <div key={idx}>
                <button
                  onClick={() => handleAnswer(idx)}
                  disabled={result !== null || submitting}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer disabled:cursor-default ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-xs font-mono font-medium">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-sm"><GlossaryText text={option} /></span>
                    {result && idx === result.correctIndex && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {result && idx === picked && !result.correct && idx !== result.correctIndex && <X className="w-5 h-5 text-red-400 shrink-0" />}
                  </div>
                </button>
                {feedbackText && (
                  <div className={`mx-2 mt-1 mb-1 px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                    feedbackType === "correct" ? "bg-emerald-500/5 border border-emerald-500/20 text-zinc-300" : "bg-red-500/5 border border-red-500/20 text-zinc-300"
                  }`}>
                    {feedbackType === "correct" && <span className="text-emerald-400 font-medium text-xs block mb-1">Correct!</span>}
                    {feedbackType === "wrong" && <span className="text-red-400 font-medium text-xs block mb-1">Not quite...</span>}
                    <GlossaryText text={feedbackText} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next button */}
      {result && (
        <button
          onClick={fetchQuestion}
          className="self-center flex items-center gap-2 px-8 py-4 bg-[#D97757] hover:bg-[#E8956F] text-white font-semibold text-base rounded-xl transition-colors duration-200 cursor-pointer shadow-lg shadow-[#D97757]/20"
        >
          Next Question
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
