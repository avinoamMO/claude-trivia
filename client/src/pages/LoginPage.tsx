import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";

interface LoginPageProps {
  onLogin: (name: string) => Promise<void>;
  loading: boolean;
}

export default function LoginPage({ onLogin, loading }: LoginPageProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 0 && trimmed.length <= 20) {
      onLogin(trimmed);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#232323] border border-[#333] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#D97757]/15 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#D97757]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Claude Architect</h1>
            <p className="text-[#D97757] text-sm font-medium mt-1">Trivia Challenge</p>
            <p className="text-zinc-500 text-xs mt-2 text-center">
              351 questions across 5 domains. Prove your expertise.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="Enter your name..."
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] transition-colors"
                maxLength={20}
                autoFocus
                disabled={loading}
              />
              <p className="text-zinc-600 text-xs mt-1 text-right">
                {name.length}/20
              </p>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full bg-[#D97757] hover:bg-[#E8956F] disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "Start Playing"}
            </button>
          </form>
        </div>

        <p className="text-zinc-600 text-[10px] text-center mt-4">
          Not affiliated with or endorsed by Anthropic. Community project.
        </p>
      </div>
    </div>
  );
}
