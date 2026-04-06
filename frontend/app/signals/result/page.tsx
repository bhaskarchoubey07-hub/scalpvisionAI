"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import type { AnalysisResult } from "@/lib/api";
import { TrendingUp, TrendingDown, AlertCircle, ArrowLeft } from "lucide-react";

function fmt(value: number | null | undefined, decimals = 2) {
  if (value == null) return "—";
  return value.toFixed(decimals);
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
          <p>No analysis result found. Please upload a chart first.</p>
          <button
            onClick={() => router.push("/upload")}
            className="mt-2 flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="grid-shell py-8">
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  const isLong = signal.direction?.toLowerCase() === "long" || signal.direction?.toLowerCase() === "buy";
  const confidence = signal.confidence ?? 0;

  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="Signal Output"
        title="AI-generated scalp setup"
        description="Combining raw chart interpretation with execution-ready levels and confidence reasoning."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Chart preview panel */}
        <div className="glass rounded-[2rem] p-6">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(61,217,184,0.08),rgba(16,28,49,0.9))]">
            {signal.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signal.imageUrl}
                alt="Analyzed chart"
                className="w-full rounded-[1.5rem] object-contain"
              />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-slate-500 text-sm">
                Chart preview unavailable
              </div>
            )}
          </div>

          {/* AI detected indicators */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-3">
              Pattern: {signal.pattern ?? "Detected"}
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              RSI: {signal.rsi != null ? signal.rsi.toFixed(1) : "—"}
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              MACD: {signal.macd ?? "—"}
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              TF: {signal.timeframe ?? "—"}
            </div>
          </div>
        </div>

        {/* Signal details */}
        <div className="glass rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {signal.symbol ?? signal.market ?? "Chart Signal"}
              </h2>
              <div className={`mt-1 flex items-center gap-1 text-sm font-medium ${isLong ? "text-emerald-400" : "text-red-400"}`}>
                {isLong ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {signal.direction?.toUpperCase() ?? "—"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-accent">{confidence}%</div>
              <div className="text-xs text-slate-400">confidence</div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-700"
              style={{ width: `${confidence}%` }}
            />
          </div>

          {/* Key levels */}
          <div className="mt-6 space-y-3">
            {[
              { label: "Entry Price", value: fmt(signal.entry_price), color: "text-accent" },
              { label: "Stop Loss", value: fmt(signal.stop_loss), color: "text-red-400" },
              { label: "Take Profit", value: fmt(signal.take_profit), color: "text-emerald-400" },
              { label: "Risk / Reward", value: signal.risk_reward != null ? `${fmt(signal.risk_reward)}x` : "—", color: "text-slate-200" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <span className="text-sm text-slate-400">{label}</span>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* AI summary */}
          {signal.summary && (
            <div className="mt-6 rounded-2xl border border-white/10 p-4">
              <div className="mb-2 text-sm font-semibold text-white">AI Analysis</div>
              <p className="text-sm leading-relaxed text-slate-300">{signal.summary}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/upload")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-slate-300 hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" /> New Chart
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("latestSignal");
                router.push("/upload");
              }}
              className="flex-1 rounded-2xl bg-accent/10 py-3 text-sm font-medium text-accent hover:bg-accent/20"
            >
              Analyse Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
