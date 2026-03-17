import { useState } from "react";
import { Sparkles, MessageCircle, LogOut, BarChart3, Share2, Github } from "lucide-react";
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
        {/* Left sidebar — scoreboard & stats first, achievements lower */}
        <aside className="w-72 border-r border-[#333] p-4 space-y-4 overflow-y-auto">
          <Scoreboard sessionId={sessionId} />
          <CategoryStats sessionId={sessionId} />
          <Achievements sessionId={sessionId} />

          {/* Disclaimer — bottom of sidebar */}
          <div className="pt-2">
            <p className="text-zinc-600 text-[10px] leading-relaxed">
              Not affiliated with Anthropic.
              {" "}Open source by{" "}
              <a href="https://x.com/avinoamoltchik" target="_blank" rel="noopener noreferrer" className="text-[#D97757]/60 hover:text-[#D97757]">Avinoam Oltchik</a>
              {" "}&middot;{" "}
              <a href="https://github.com/avinoamMO/claude-trivia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[#D97757]/60 hover:text-[#D97757]">
                <Github className="w-2.5 h-2.5" /> GitHub
              </a>
            </p>
            <p className="text-zinc-400 text-sm mt-2 font-medium">
              Made with Love in{" "}
              <span className="font-bold bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent">Israel</span>
              {" "}🇮🇱
            </p>
          </div>
        </aside>

        {/* Center: Quiz */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Quiz sessionId={sessionId} />
        </main>

        {/* Right sidebar */}
        <aside className="w-80 border-l border-[#333] flex flex-col">
          <Chat sessionId={sessionId} name={name} />
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="flex-1 flex flex-col lg:hidden overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mobileTab === "quiz" && (
            <div className="h-full overflow-y-auto">
              <Quiz sessionId={sessionId} />
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
