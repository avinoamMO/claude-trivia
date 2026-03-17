import { useState, useEffect, useCallback } from "react";
import { Trophy } from "lucide-react";
import { getLeaderboard } from "../lib/api";
import { socket } from "../lib/socket";
import type { LeaderboardEntry } from "../lib/types";

interface ScoreboardProps {
  sessionId: string;
}

type Period = "daily" | "weekly" | "allTime";
const periodLabels: Record<Period, string> = { daily: "Daily", weekly: "Weekly", allTime: "All Time" };

function countryFlag(code?: string) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

export default function Scoreboard({ sessionId }: ScoreboardProps) {
  const [period, setPeriod] = useState<Period>("daily");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try { setEntries(await getLeaderboard(period)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);
  useEffect(() => {
    const handler = () => fetchLeaderboard();
    socket.on("leaderboard:update", handler);
    return () => { socket.off("leaderboard:update", handler); };
  }, [fetchLeaderboard]);

  return (
    <div className="bg-[#232323] border border-[#333] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333]">
        <Trophy className="w-4 h-4 text-[#D97757]" />
        <h3 className="text-sm font-semibold text-white">Scoreboard</h3>
      </div>

      <div className="flex border-b border-[#333]">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
              period === p ? "text-[#D97757] border-b-2 border-[#D97757]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      <div className="max-h-52 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-zinc-500 text-sm">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-sm">No scores yet</div>
        ) : (
          <div className="divide-y divide-[#333]/50">
            {entries.slice(0, 20).map((entry, idx) => {
              const isMe = entry.sessionId === sessionId;
              const flag = countryFlag(entry.country);
              return (
                <div key={entry.sessionId} className={`flex items-center gap-3 px-4 py-2 ${isMe ? "bg-[#D97757]/5" : ""}`}>
                  <span className={`w-5 text-xs font-mono text-right ${idx < 3 ? "text-yellow-400 font-bold" : "text-zinc-500"}`}>
                    {idx + 1}
                  </span>
                  {flag && <span className="text-sm">{flag}</span>}
                  <span className={`flex-1 text-sm truncate ${isMe ? "text-[#D97757] font-medium" : "text-zinc-300"}`}>
                    {entry.name}
                    {isMe && <span className="ml-1 text-xs text-[#D97757]/60">(you)</span>}
                  </span>
                  <span className="text-sm font-mono text-white">{entry.totalCorrect}</span>
                  <span className="text-xs text-zinc-500 w-10 text-right">{entry.accuracy}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
