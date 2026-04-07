"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/section-header";
import type { AnalysisResult } from "@/lib/api";
import { TrendingUp, TrendingDown, AlertCircle, ArrowLeft, Target, ShieldAlert, Zap, Layers } from "lucide-react";
import clsx from "clsx";

function fmt(value: number | null | undefined, decimals = 2) {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function SignalResultPage() {
  const router = useRouter();
  const [signal, setSignal] = useState<(AnalysisResult & { imageUrl?: string }) | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("latestSignal");
      if (raw) {
        setSignal(JSON.parse(raw) as AnalysisResult & { imageUrl?: string });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div className="grid-shell py-8">
        <div className="flex flex-col items-center gap-4 py-24 text-slate-400">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="font-medium">No analysis result found. Please upload a chart first.</p>
          <button
            onClick={() => router.push("/upload")}
            className="mt-2 flex items-center gap-2 rounded-full bg-accent/10 px-6 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="grid-shell py-8 text-center">
        <div className="flex items-center justify-center py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent shadow-glow" />
        </div>
      </div>
    );
  }

  const isLong = signal.direction?.toLowerCase() === "long" || signal.direction?.toLowerCase() === "buy";
  const confidence = signal.confidence ?? 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="grid-shell py-8"
    >
      <SectionHeader
        eyebrow="AI Signal Intelligence"
        title="Institutional analysis report"
        description="Multi-factor confluence analysis combining technical indicators and price action logic."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left: Chart Preview & Technicals */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="glass-card flex flex-col p-2">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-black/40">
              {signal.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signal.imageUrl}
                  alt="Analyzed chart"
                  className="w-full object-contain"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center text-slate-500">
                  Chart preview unavailable
                </div>
              )}
              <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50 backdrop-blur-md border border-white/10">
                Live Analysis Context
              </div>
            </div>

            {/* Quick Indicators Bar */}
            <div className="grid grid-cols-4 gap-2 p-3">
              {[
                { label: "Pattern", value: signal.pattern ?? "Detected", icon: Zap },
                { label: "RSI (14)", value: signal.rsi?.toFixed(1) ?? "—", icon: Layers },
                { label: "MACD", value: signal.macd ?? "—", icon: TrendingUp },
                { label: "TF", value: signal.timeframe ?? "—", icon: Zap },
              ].map((ind, i) => (
                <div key={i} className="flex flex-col items-center justify-center rounded-xl bg-white/[0.03] py-3 border border-white/[0.05]">
                  <ind.icon className="mb-1.5 h-3.5 w-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-tight text-slate-500">{ind.label}</span>
                  <span className="mt-0.5 text-xs font-bold text-white">{ind.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Signal Core */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {signal.symbol ?? "Signal Setup"}
                </h2>
                <div className={clsx(
                  "mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold tracking-wide",
                  isLong ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  {isLong ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {signal.direction?.toUpperCase()} SIGNAL
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-4xl font-black text-accent">{confidence}%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Confidence Score</div>
              </div>
            </div>

            {/* Confidence Visualization */}
            <div className="mt-8">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                <span>Sentiment Alignment</span>
                <span>{confidence}% Scale</span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                />
              </div>
            </div>

            {/* Trade Matrix */}
            <div className="mt-10 grid gap-4">
              {[
                { label: "Entry Entry", value: fmt(signal.entry_price), icon: Zap, color: "text-accent" },
                { label: "Stop Loss", value: fmt(signal.stop_loss), icon: ShieldAlert, color: "text-red-400" },
                { label: "Take Profit", value: fmt(signal.take_profit), icon: Target, color: "text-emerald-400" },
                { label: "Risk Reward", value: signal.risk_reward ? `${fmt(signal.risk_reward)}x` : "—", icon: Zap, color: "text-primary" },
              ].map((item, i) => (
                <div key={i} className="group flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-white/[0.1]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.03] group-hover:bg-accent/10 transition-colors">
                      <item.icon className="h-4 w-4 text-slate-500 group-hover:text-accent" />
                    </div>
                    <span className="text-sm font-medium text-slate-400">{item.label}</span>
                  </div>
                  <span className={clsx("font-heading text-lg font-bold tracking-tight", item.color)}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Narrative */}
            {signal.summary && (
              <div className="mt-10 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <span className="h-px flex-1 bg-white/10" />
                  AI Rationale
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <p className="text-sm leading-relaxed text-slate-300 antialiased italic">
                  &quot;{signal.summary}&quot;
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-10 flex gap-4">
              <button
                onClick={() => router.push("/upload")}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 text-sm font-bold text-slate-300 transition-all hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> NEW SCAN
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem("latestSignal");
                  router.push("/upload");
                }}
                className="flex-[1.5] rounded-2xl bg-accent px-6 py-4 text-sm font-black tracking-widest text-black shadow-glow transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
              >
                ANALYSE ANOTHER
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
