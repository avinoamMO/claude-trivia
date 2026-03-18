import { useState, useEffect } from "react";
import { Sparkles, MessageCircle, LogOut, BarChart3, Share2, Github } from "lucide-react";
import { getCategories } from "../lib/api";
import Quiz from "../components/Quiz";
import Scoreboard from "../components/Scoreboard";
import Chat from "../components/Chat";
import CategoryStats from "../components/CategoryStats";
import Achievements from "../components/Achievements";

interface MainPageProps {
  sessionId: string;
  name: string;
  onLogout: () => void;
}

type MobileTab = "quiz" | "scores" | "chat";

export default function MainPage({ sessionId, name, onLogout }: MainPageProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("quiz");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const handleInvite = async () => {
    const url = window.location.origin;
    const text = "Test your Claude Architect knowledge! 🧠";
    if (navigator.share) {
      try { await navigator.share({ title: "Claude Architect Trivia", text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-[#333] bg-[#1a1a1a]/90 backdrop-blur-sm sticky top-0 z-10">
        <Sparkles className="w-5 h-5 text-[#D97757]" />
        <h1 className="text-sm font-semibold text-white">Claude Architect</h1>
        <span className="text-[10px] text-[#D97757] font-medium bg-[#D97757]/10 px-2 py-0.5 rounded-full">TRIVIA</span>
        <div className="flex-1" />
        <button
          onClick={handleInvite}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#D97757]/10 text-[#D97757] hover:bg-[#D97757]/20 rounded-lg transition-colors cursor-pointer"
          title="Invite friends"
        >
          <Share2 className="w-3.5 h-3.5" />
          Invite
        </button>
        <span className="text-xs text-zinc-400">
          <span className="text-[#D97757] font-medium">{name}</span>
        </span>
        <button onClick={onLogout} className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Desktop layout */}
      <div className="flex-1 hidden lg:flex overflow-hidden">
        {/* Left sidebar — scoreboard & stats */}
        <aside className="w-64 border-r border-[#333] flex flex-col">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Scoreboard sessionId={sessionId} />
            <CategoryStats sessionId={sessionId} />
            <Achievements sessionId={sessionId} />
          </div>
          <div className="px-4 py-3 border-t border-[#333] bg-[#1a1a1a]">
            <p className="text-zinc-600 text-[10px] leading-relaxed">
              Not affiliated with Anthropic.
              {" "}Open source by{" "}
              <a href="https://www.linkedin.com/in/avinoam1" target="_blank" rel="noopener noreferrer" className="text-[#D97757]/60 hover:text-[#D97757]">Avinoam Oltchik</a>
              {" "}&middot;{" "}
              <a href="https://github.com/avinoamMO/claude-trivia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[#D97757]/60 hover:text-[#D97757]">
                <Github className="w-2.5 h-2.5" /> GitHub
              </a>
            </p>
            <p className="text-zinc-300 text-base mt-1.5 font-semibold">
              Made with Love in{" "}
              <span className="font-bold bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent">Israel</span>
              {" "}🇮🇱
            </p>
          </div>
        </aside>

        {/* Center: Quiz */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Quiz sessionId={sessionId} selectedCategory={selectedCategory} selectedDifficulty={selectedDifficulty} setSelectedDifficulty={setSelectedDifficulty} />
          </div>
        </main>

        {/* Right sidebar — Controls + Chat */}
        <aside className="w-80 border-l border-[#333] flex flex-col overflow-hidden">
          {/* Category selector — 20% bigger */}
          <div className="p-4 pb-5 border-b border-[#333] shrink-0">
            <h4 className="text-[10px] font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Category</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedCategory("")} className={`px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${selectedCategory === "" ? "bg-[#D97757] text-white" : "bg-[#2a2a2a] text-zinc-400 hover:text-white"}`}>All</button>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${selectedCategory === cat ? "bg-[#D97757] text-white" : "bg-[#2a2a2a] text-zinc-400 hover:text-white"}`}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Difficulty selector — visually distinct with active indicator */}
          <div className="p-4 border-b border-[#333] bg-[#1e1e1e] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Difficulty</h4>
              <span className="text-[10px] text-zinc-500">
                {selectedDifficulty ? (
                  <>Level <span className="text-[#D97757] font-bold">{selectedDifficulty}</span> selected</>
                ) : (
                  <span className="text-zinc-600">All levels</span>
                )}
              </span>
            </div>
            <div className="flex gap-1">
              {[
                { d: 1, label: "Basics", color: "text-emerald-400", bg: "bg-emerald-400/20", ring: "ring-emerald-400/60" },
                { d: 2, label: "How?", color: "text-sky-400", bg: "bg-sky-400/20", ring: "ring-sky-400/60" },
                { d: 3, label: "Debug", color: "text-yellow-400", bg: "bg-yellow-400/20", ring: "ring-yellow-400/60" },
                { d: 4, label: "Why?", color: "text-orange-400", bg: "bg-orange-400/20", ring: "ring-orange-400/60" },
                { d: 5, label: "Architect", color: "text-red-400", bg: "bg-red-400/20", ring: "ring-red-400/60" },
              ].map(({ d, label, color, bg, ring }) => (
                <button key={d} onClick={() => setSelectedDifficulty(selectedDifficulty === d ? undefined : d)} className={`flex-1 py-2.5 rounded-lg text-center transition-all cursor-pointer ${selectedDifficulty === d ? `${color} ${bg} ring-2 ${ring} scale-105` : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"}`}>
                  <span className="text-sm font-bold block">{d}</span>
                  <span className="text-[9px] block mt-0.5">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Chat sessionId={sessionId} name={name} />
          </div>
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="flex-1 flex flex-col lg:hidden overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mobileTab === "quiz" && (
            <div className="h-full overflow-y-auto">
              <Quiz sessionId={sessionId} selectedCategory={selectedCategory} selectedDifficulty={selectedDifficulty} setSelectedDifficulty={setSelectedDifficulty} />
            </div>
          )}
          {mobileTab === "scores" && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <Scoreboard sessionId={sessionId} />
              <CategoryStats sessionId={sessionId} />
              <Achievements sessionId={sessionId} />
            </div>
          )}
          {mobileTab === "chat" && (
            <div className="h-full flex flex-col">
              <Chat sessionId={sessionId} name={name} />
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#333] text-left lg:hidden">
          <p className="text-zinc-500 text-[10px] flex items-center gap-1 flex-wrap">
            <span>Not affiliated with Anthropic</span>
            <span>&middot;</span>
            <a href="https://x.com/avinoamoltchik" target="_blank" rel="noopener noreferrer" className="text-[#D97757]/70">Avinoam Oltchik</a>
            <span>&middot;</span>
            <a href="https://github.com/avinoamMO/claude-trivia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[#D97757]/70">
              <Github className="w-3 h-3" />
            </a>
            <span>&middot; Made with Love in</span>
            <span className="inline-flex items-center gap-0.5">
              <span className="font-semibold bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent">Israel</span>
              <span className="text-xs">🇮🇱</span>
            </span>
          </p>
        </div>

        <nav className="flex border-t border-[#333] bg-[#1a1a1a]/90 backdrop-blur-sm">
          <button onClick={() => setMobileTab("quiz")} className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs cursor-pointer ${mobileTab === "quiz" ? "text-[#D97757]" : "text-zinc-500"}`}>
            <Sparkles className="w-5 h-5" /> Quiz
          </button>
          <button onClick={() => setMobileTab("scores")} className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs cursor-pointer ${mobileTab === "scores" ? "text-[#D97757]" : "text-zinc-500"}`}>
            <BarChart3 className="w-5 h-5" /> Scores
          </button>
          <button onClick={() => setMobileTab("chat")} className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs cursor-pointer ${mobileTab === "chat" ? "text-[#D97757]" : "text-zinc-500"}`}>
            <MessageCircle className="w-5 h-5" /> Chat
          </button>
        </nav>
      </div>
    </div>
  );
}
