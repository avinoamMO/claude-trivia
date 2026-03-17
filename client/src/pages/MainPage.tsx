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
        <aside className="w-72 border-r border-[#333] flex flex-col">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Scoreboard sessionId={sessionId} />
            <CategoryStats sessionId={sessionId} />
            <Achievements sessionId={sessionId} />
          </div>

          {/* Disclaimer — sticky bottom of sidebar */}
          <div className="px-4 py-3 border-t border-[#333] bg-[#1a1a1a]">
            <p className="text-zinc-600 text-[10px] leading-relaxed">
              Not affiliated with Anthropic.
              {" "}Open source by{" "}
              <a href="https://x.com/avinoamoltchik" target="_blank" rel="noopener noreferrer" className="text-[#D97757]/60 hover:text-[#D97757]">Avinoam Oltchik</a>
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

        {/* Center: Quiz + bottom row (Chat left, controls right) */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Quiz sessionId={sessionId} />
            {/* Bottom row: Chat left, info right */}
            <div className="flex gap-4 px-4 lg:px-6 pb-6">
              <div className="w-96 shrink-0 h-72">
                <Chat sessionId={sessionId} name={name} />
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="bg-[#232323] border border-[#333] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Topics</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Agentic Architecture &middot; Claude Code Config &middot; Context & Reliability &middot; Prompt Engineering &middot; Tool Design & MCP
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">Use the category bubbles above to filter by topic. Difficulty auto-increases after 3 correct in a row.</p>
                </div>
                <div className="bg-[#232323] border border-[#333] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Difficulty Levels</h4>
                  <div className="space-y-1">
                    <p className="text-xs"><span className="text-emerald-400 font-medium">1</span> <span className="text-zinc-500">What is this?</span></p>
                    <p className="text-xs"><span className="text-sky-400 font-medium">2</span> <span className="text-zinc-500">How does it work?</span></p>
                    <p className="text-xs"><span className="text-yellow-400 font-medium">3</span> <span className="text-zinc-500">What's wrong here?</span></p>
                    <p className="text-xs"><span className="text-orange-400 font-medium">4</span> <span className="text-zinc-500">Why did it break?</span></p>
                    <p className="text-xs"><span className="text-red-400 font-medium">5</span> <span className="text-zinc-500">Architect it</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
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
