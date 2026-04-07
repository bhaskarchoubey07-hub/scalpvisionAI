"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, X, MessageSquare, Send, Bot, User, Sparkles } from "lucide-react";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const AIAdvisorDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Greetings! I am your ScalpVision AI Advisor. How can I assist your market analysis today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/ai-advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          context: {} // Could pass current chart context if available
        })
      });

      if (!response.ok) throw new Error("Advisor offline");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm currently experiencing high latency. Please try again shortly." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05, shadow: "0 0 20px rgba(6, 182, 212, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg"
      >
        <BrainCircuit className="h-6 w-6" />
        <motion.div
           animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
           transition={{ repeat: Infinity, duration: 2 }}
           className="absolute inset-0 rounded-full bg-accent"
        />
      </motion.button>

      {/* Advisor Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-[70] flex w-full flex-col border-l border-white/10 bg-[#030712]/95 p-0 shadow-2xl backdrop-blur-2xl lg:w-[400px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold tracking-widest text-white uppercase">AI Advisor</h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Analysis Node
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-white/[0.05] p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Content */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "flex gap-3",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      msg.role === "assistant" ? "bg-accent/10 border-accent/20 text-accent" : "bg-white/5 border-white/10 text-slate-400"
                    )}>
                      {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className={clsx(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "assistant" ? "bg-white/[0.03] text-slate-200 border border-white/[0.05]" : "bg-accent text-black font-medium"
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="h-1 w-1 rounded-full bg-accent animate-bounce" />
                      <div className="h-1 w-1 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                      <div className="h-1 w-1 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-white/10 bg-white/[0.02] p-6">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask about strategies or indicators..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-slate-500 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-black shadow-glow transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                  Alpha Intelligence • Use for educational purposes.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
