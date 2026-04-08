"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { fetchSignalById } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";

type Indicator = {
  name: string;
  value: string;
  bias: string;
};

type SignalData = {
  id: string;
  market: string;
  symbol?: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward: number;
  confidence: number;
  summary: string;
  created_at: string;
  indicators?: Indicator[];
};

function fmt(v: number | null | undefined, dp = 2) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export default function SignalResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchSignalById(id)
      .then((data: any) => setSignal(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
        <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Synchronizing intelligence...</p>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500/50" />
        <h2 className="text-xl font-bold text-white">Signal analysis unavailable</h2>
        <p className="text-sm text-slate-500 max-w-md text-center">{error || "The requested signal could not be found or is no longer in the live database."}</p>
      </div>
    );
  }

  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="Signal Output"
        title="AI-generated scalp setup"
        description="This view combines raw chart interpretation with execution-ready levels and confidence reasoning."
      />
      
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-[2rem] p-6">
          <div className="aspect-[16/10] rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(61,217,184,0.12),rgba(16,28,49,0.9))] p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <div className="text-6xl font-black uppercase tracking-tighter">{signal.market}</div>
            </div>
            
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-1">Market Pulse</div>
              <div className="text-3xl font-black text-white">{signal.symbol || signal.market}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
                <div className="text-xs font-bold text-emerald-400">ACTIVE</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeframe</div>
                <div className="text-xs font-bold text-white">5M / 15M</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center sm:text-left">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">RSI</div>
                <div className="text-xs font-bold text-white">DYNAMIC</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center sm:text-left">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trend</div>
                <div className="text-xs font-bold text-white uppercase">{signal.direction.includes('Long') ? 'Bullish' : 'Bearish'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">{signal.symbol || signal.market}</h2>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-accent">{signal.confidence}%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CONFIDENCE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Entry Price</div>
              <div className="text-xl font-black text-white">{fmt(signal.entry_price)}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Risk/Reward</div>
              <div className="text-xl font-black text-accent">{fmt(signal.risk_reward)}x</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-red-500/5 p-5 border-red-500/10">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Stop Loss</div>
              <div className="text-xl font-black text-white">{fmt(signal.stop_loss)}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-emerald-500/5 p-5 border-emerald-500/10">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Take Profit</div>
              <div className="text-xl font-black text-white">{fmt(signal.take_profit)}</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Strategic Summary</div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <p className="text-sm font-medium leading-relaxed text-slate-300 italic">
                &quot;{signal.summary}&quot;
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between p-4 rounded-2xl bg-accent/5 border border-accent/10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold text-accent uppercase tracking-widest">Live execution suggested</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Valid for next 15-30 mins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
