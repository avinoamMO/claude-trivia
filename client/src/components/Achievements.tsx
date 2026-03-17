import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { getAchievements } from "../lib/api";
import type { Achievement } from "../lib/types";

interface AchievementsProps {
  sessionId: string;
}

export default function Achievements({ sessionId }: AchievementsProps) {
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [all, setAll] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAchievements(sessionId);
        setEarned(data.earned);
        setAll(data.all);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const earnedIds = new Set(earned.map(a => a.id));

  return (
    <div className="bg-[#232323] border border-[#333] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333]">
        <Trophy className="w-4 h-4 text-[#D97757]" />
        <h3 className="text-sm font-semibold text-white">Achievements</h3>
        <span className="ml-auto text-xs text-zinc-500">{earned.length}/{all.length}</span>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="text-center text-zinc-500 text-sm py-4">Loading...</div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {all.map((achievement) => {
              const isEarned = earnedIds.has(achievement.id);
              return (
                <div
                  key={achievement.id}
                  title={`${achievement.name}: ${achievement.description}`}
                  className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                    isEarned
                      ? "bg-[#D97757]/10 border border-[#D97757]/30"
                      : "bg-[#1a1a1a] border border-transparent opacity-30"
                  }`}
                >
                  <span className="text-xl">{achievement.icon}</span>
                  <span className={`text-[9px] mt-1 text-center leading-tight px-1 ${
                    isEarned ? "text-zinc-300" : "text-zinc-600"
                  }`}>
                    {achievement.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
