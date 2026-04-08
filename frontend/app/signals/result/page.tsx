"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/section-header";
import type { AnalysisResult } from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowLeft,
  Target,
  ShieldAlert,
  Zap,
  Layers,
  BarChart3,
  Activity,
  Gauge,
  Timer,
} from "lucide-react";
import clsx from "clsx";

function fmt(value: number | null | undefined, decimals = 2) {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function biasColor(bias: string) {
  if (bias === "bullish") return "text-emerald-400";
  if (bias === "bearish") return "text-red-400";
  return "text-slate-400";
}

function biasBg(bias: string) {
  if (bias === "bullish") return "bg-emerald-500/10 border-emerald-500/20";
  if (bias === "bearish") return "bg-red-500/10 border-red-500/20";
  return "bg-white/[0.03] border-white/[0.08]";
}

function dirIcon(dir: string) {
  if (dir === "long") return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  if (dir === "short") return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
  return <Activity className="h-3.5 w-3.5 text-slate-400" />;
}

export default function SignalResultPage() {
  const router = useRouter();
  const [signal, setSignal] = useState<
    (AnalysisResult & { imageUrl?: string }) | null
  >(null);
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
          <p className="font-medium">
            No analysis result found. Please upload a chart first.
          </p>
          <button
            onClick={() => router.push("/upload")}
            className="mt-2 flex items-center gap-2 rounded-full bg-accent/10 px-6 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Analysis
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

  const isLong =
    signal.direction?.toLowerCase() === "long" ||
    signal.direction?.toLowerCase() === "buy";
  const confidence = signal.confidence ?? 0;
  const indicators = signal.indicators ?? [];
  const timeframes = signal.timeframe_analysis ?? [];
  const supports = signal.supports ?? [];
  const resistances = signal.resistances ?? [];
  const patterns = signal.patterns ?? [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
        description="Multi-factor confluence analysis combining 9 technical indicators across 3 timeframes with ATR-based risk management."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left Column ── */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Signal Header Card */}
          <div className="glass-card p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {signal.symbol ?? "Signal Setup"}
                </h2>
                {signal.current_price && (
                  <div className="mt-1 text-lg font-semibold text-slate-300">
                    ₹{fmt(signal.current_price)}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold tracking-wide",
                      isLong
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : signal.direction === "neutral"
                        ? "bg-white/5 text-slate-400 border border-white/10"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    )}
                  >
                    {isLong ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : signal.direction === "neutral" ? (
                      <Activity className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {signal.signal || signal.direction?.toUpperCase()} SIGNAL
                  </div>
                  {signal.trend && (
                    <span className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {signal.trend}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-accent shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                    </span>
                    AI Calibrated
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-4xl font-black text-accent">
                  {confidence}%
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Confidence
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
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
                  className={clsx(
                    "h-full shadow-[0_0_15px_rgba(6,182,212,0.5)]",
                    confidence >= 65
                      ? "bg-gradient-to-r from-primary to-accent"
                      : confidence >= 45
                      ? "bg-gradient-to-r from-yellow-500/70 to-yellow-400"
                      : "bg-gradient-to-r from-slate-500 to-slate-400"
                  )}
                />
              </div>
            </div>

            {/* Trade Matrix */}
            <div className="mt-10 grid gap-4">
              {[
                {
                  label: "Entry Price",
                  value: `₹${fmt(signal.entry_price)}`,
                  icon: Zap,
                  color: "text-accent",
                },
                {
                  label: "Stop Loss",
                  value: `₹${fmt(signal.stop_loss)}`,
                  icon: ShieldAlert,
                  color: "text-red-400",
                },
                {
                  label: "Take Profit",
                  value: `₹${fmt(signal.take_profit)}`,
                  icon: Target,
                  color: "text-emerald-400",
                },
                {
                  label: "Risk Reward",
                  value: signal.risk_reward
                    ? `${fmt(signal.risk_reward)}x`
                    : "—",
                  icon: BarChart3,
                  color: "text-primary",
                },
                {
                  label: "ATR (14)",
                  value: signal.atr ? `₹${fmt(signal.atr)}` : "—",
                  icon: Activity,
                  color: "text-slate-300",
                },
                {
                  label: "Volatility",
                  value: signal.volatility_percent
                    ? `${fmt(signal.volatility_percent)}%`
                    : "—",
                  icon: Gauge,
                  color: "text-slate-300",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-white/[0.1]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.03] group-hover:bg-accent/10 transition-colors">
                      <item.icon className="h-4 w-4 text-slate-500 group-hover:text-accent" />
                    </div>
                    <span className="text-sm font-medium text-slate-400">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={clsx(
                      "font-heading text-lg font-bold tracking-tight",
                      item.color
                    )}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Support / Resistance Levels */}
          {(supports.length > 0 || resistances.length > 0) && (
            <motion.div variants={itemVariants} className="glass-card p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                <Layers className="h-3.5 w-3.5 text-accent" />
                Key Price Levels
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-2">
                    Support Levels
                  </div>
                  {supports.length > 0 ? (
                    supports.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] px-4 py-2"
                      >
                        <span className="text-[10px] font-bold text-slate-500">
                          S{i + 1}
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          ₹{fmt(s)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">No levels detected</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-400/70 mb-2">
                    Resistance Levels
                  </div>
                  {resistances.length > 0 ? (
                    resistances.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-red-500/10 bg-red-500/[0.02] px-4 py-2"
                      >
                        <span className="text-[10px] font-bold text-slate-500">
                          R{i + 1}
                        </span>
                        <span className="text-sm font-bold text-red-400">
                          ₹{fmt(r)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">No levels detected</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── Right Column ── */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Indicator Grid */}
          {indicators.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">
                <Gauge className="h-3.5 w-3.5 text-accent" />
                Technical Indicators ({indicators.length})
              </div>
              <div className="space-y-2.5">
                {indicators.map((ind, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "flex items-center justify-between rounded-xl border p-3.5 transition-all",
                      biasBg(ind.bias)
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "h-2 w-2 rounded-full",
                          ind.bias === "bullish"
                            ? "bg-emerald-400"
                            : ind.bias === "bearish"
                            ? "bg-red-400"
                            : "bg-slate-400"
                        )}
                      />
                      <span className="text-xs font-bold text-white">
                        {ind.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={clsx(
                          "text-xs font-semibold",
                          biasColor(ind.bias)
                        )}
                      >
                        {ind.value}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 w-8 text-right">
                        +{ind.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Score Summary */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Total Indicator Weight
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-emerald-400">
                    Bull: {indicators.filter(i => i.bias === "bullish").reduce((sum, i) => sum + i.score, 0)}
                  </span>
                  <span className="text-xs font-bold text-red-400">
                    Bear: {indicators.filter(i => i.bias === "bearish").reduce((sum, i) => sum + i.score, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pattern Alerts */}
          {patterns.length > 0 && (
            <div className="glass-card p-6 border-accent/20 bg-accent/[0.01]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent mb-5">
                <Zap className="h-3.5 w-3.5" />
                High-Probability Patterns ({patterns.length})
              </div>
              <div className="space-y-4">
                {patterns.map((p, i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "text-xs font-black uppercase tracking-tight",
                            p.type === "bullish" ? "text-emerald-400" : "text-red-400"
                          )}>
                            {p.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded">
                            {p.strength}% Edge
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-TF Consensus */}
          {timeframes.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">
                <Timer className="h-3.5 w-3.5 text-accent" />
                Multi-Timeframe Consensus
              </div>
              <div className="space-y-3">
                {timeframes.map((tf, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-3">
                      {dirIcon(tf.direction)}
                      <span className="text-sm font-bold text-white uppercase">
                        {tf.timeframe}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={clsx(
                          "text-xs font-bold px-2 py-0.5 rounded-md",
                          tf.direction === "long"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : tf.direction === "short"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-white/5 text-slate-400"
                        )}
                      >
                        {tf.direction.toUpperCase()}
                      </span>
                      <div className="text-right w-14">
                        <div className="text-xs font-bold text-white">
                          {tf.confidence}%
                        </div>
                        <div className="text-[9px] text-slate-500">conf</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Indicators Bar (legacy format for backward compat) */}
          {indicators.length === 0 && (
            <div className="glass-card p-6">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Pattern", value: signal.pattern ?? "Detected", icon: Zap },
                  { label: "RSI (14)", value: signal.rsi?.toFixed(1) ?? "—", icon: Layers },
                  { label: "MACD", value: signal.macd ?? "—", icon: TrendingUp },
                  { label: "TF", value: signal.timeframe ?? "—", icon: Timer },
                ].map((ind, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center rounded-xl bg-white/[0.03] py-3 border border-white/[0.05]"
                  >
                    <ind.icon className="mb-1.5 h-3.5 w-3.5 text-accent" />
                    <span className="text-[10px] font-medium uppercase tracking-tight text-slate-500">
                      {ind.label}
                    </span>
                    <span className="mt-0.5 text-xs font-bold text-white">
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Narrative */}
          {signal.summary && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
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
          <div className="flex gap-4">
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
        </motion.div>
      </div>
    </motion.div>
  );
}
