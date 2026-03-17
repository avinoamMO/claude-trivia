import { useState, useEffect, useRef, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getRecentChat } from "../lib/api";
import { socket } from "../lib/socket";
import type { ChatMessage } from "../lib/types";

interface ChatProps {
  sessionId: string;
  name: string;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nameColor(name: string) {
  const colors = ["text-blue-400", "text-emerald-400", "text-amber-400", "text-pink-400", "text-cyan-400", "text-purple-400", "text-orange-400", "text-lime-400"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Chat({ sessionId, name }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getRecentChat().then(setMessages).catch(() => {}); }, []);
  useEffect(() => {
    const handler = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);
    socket.on("chat:message", handler);
    return () => { socket.off("chat:message", handler); };
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    socket.emit("chat:message", { sessionId, name, text: trimmed });
    setInput("");
  };

  return (
    <div className="bg-[#232323] border border-[#333] rounded-xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333] shrink-0">
        <MessageCircle className="w-4 h-4 text-[#D97757]" />
        <h3 className="text-sm font-semibold text-white">Chat</h3>
        <span className="text-xs text-zinc-500 ml-auto">{messages.length} messages</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 text-sm py-8">No messages yet. Say hi!</div>
        )}
        {messages.map((msg) =>
          msg.system ? (
            <div key={msg._id} className="text-center">
              <span className="text-xs text-zinc-600 italic">{msg.text}</span>
            </div>
          ) : (
            <div key={msg._id} className={msg.sessionId === sessionId ? "text-left" : "text-right"}>
              <div className={`inline-block max-w-[85%] text-left rounded-lg px-3 py-2 ${
                msg.sessionId === sessionId
                  ? "bg-[#D97757]/15 border border-[#D97757]/20"
                  : "bg-[#2a2a2a] border border-[#3a3a3a]"
              }`}>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={`text-xs font-medium ${nameColor(msg.name)}`}>{msg.name}</span>
                  <span className="text-[10px] text-zinc-600">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-300 break-words">{msg.text}</p>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-[#333] shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D97757] transition-colors"
          />
          <button type="submit" disabled={!input.trim()} className="px-3 py-2 bg-[#D97757] hover:bg-[#E8956F] disabled:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
