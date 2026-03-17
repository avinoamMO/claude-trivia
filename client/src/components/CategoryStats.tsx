import { useState, useEffect } from "react";
import { BarChart3, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { getCategoryStats, getSubtopicStats } from "../lib/api";
import type { CategoryStat, SubtopicStat } from "../lib/types";

interface CategoryStatsProps {
  sessionId: string;
}

function accuracyColor(accuracy: number) {
  if (accuracy >= 70) return "bg-emerald-500";
  if (accuracy >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function accuracyTextColor(accuracy: number) {
  if (accuracy >= 70) return "text-emerald-400";
  if (accuracy >= 40) return "text-yellow-400";
  return "text-red-400";
}

const rungLabels: Record<number, string> = {
  1: "What is this?",
  2: "How does it work?",
  3: "What's wrong here?",
  4: "Why did it break?",
  5: "Architect it",
};

export default function CategoryStats({ sessionId }: CategoryStatsProps) {
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [subtopicStats, setSubtopicStats] = useState<SubtopicStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [catData, subData] = await Promise.all([
          getCategoryStats(sessionId),
          getSubtopicStats(sessionId),
        ]);
        setStats(catData);
        setSubtopicStats(subData);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const subtopicsForCategory = (category: string) =>
    subtopicStats.filter((s) => s.category === category);

  return (
    <div className="bg-[#232323] border border-[#333] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333]">
        <BarChart3 className="w-4 h-4 text-[#D97757]" />
        <h3 className="text-sm font-semibold text-white">Your Stats</h3>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="text-center text-zinc-500 text-sm py-4">
            Loading...
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-4">
            Answer some questions to see your stats
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((stat) => {
              const subs = subtopicsForCategory(stat.category);
              const isExpanded = expandedCategories.has(stat.category);

              return (
                <div key={stat.category}>
                  {/* Category row */}
                  <button
                    onClick={() => subs.length > 0 && toggleCategory(stat.category)}
                    className={`w-full text-left ${subs.length > 0 ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {subs.length > 0 && (
                          isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                          ) : (
                            <ChevronRightIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                          )
                        )}
                        <span className="text-xs text-zinc-400 truncate max-w-[55%]">
                          {stat.category}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-xs font-medium ${accuracyTextColor(stat.accuracy)}`}
                        >
                          {stat.accuracy}%
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {stat.correct}/{stat.answered}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${accuracyColor(stat.accuracy)}`}
                        style={{ width: `${stat.accuracy}%` }}
                      />
                    </div>
                  </button>

                  {/* Subtopic breakdown */}
                  {isExpanded && subs.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2 border-l border-[#333] pl-3">
                      {subs.map((sub) => (
                        <div key={sub.subtopic}>
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[11px] text-zinc-500 truncate max-w-[50%]">
                              {sub.subtopic}
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span
                                className={`text-[11px] font-medium ${accuracyTextColor(sub.accuracy)}`}
                              >
                                {sub.accuracy}%
                              </span>
                              <span className="text-[9px] text-zinc-600">
                                L{sub.maxDifficulty}
                              </span>
                              <span className="text-[9px] text-zinc-600">
                                {sub.correct}/{sub.answered}
                              </span>
                            </div>
                          </div>
                          {/* Mini rung indicator */}
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((rung) => (
                              <div
                                key={rung}
                                title={rungLabels[rung]}
                                className={`h-1 flex-1 rounded-full ${
                                  rung <= sub.maxDifficulty
                                    ? sub.accuracy >= 70
                                      ? "bg-emerald-500/60"
                                      : "bg-yellow-500/60"
                                    : "bg-zinc-800"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
