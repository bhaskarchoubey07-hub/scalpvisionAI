"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { LiveMarketOverview } from "@/components/live-market-overview";
import { TrendingUp, TrendingDown, RefreshCw, BarChart, ArrowRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Signal = {
  id: string;
  market: string;
  direction: string;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_reward: number | null;
  confidence: number | null;
  summary: string | null;
  created_at: string;
  symbol?: string;
};

type WatchlistItem = {
  id: string;
  symbol: string;
  market: string;
  created_at: string;
};

type LiveQuote = {
  symbol: string;
  price: number;
  changePercent: number;
};

function fmt(v: number | null | undefined, dp = 2) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveQuote>>({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/signals`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Signal[]) => setSignals(Array.isArray(data) ? data : []))
      .catch(() => setSignals([]))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch(`${API}/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    })
      .then((r) => r.json())
      .then((data: WatchlistItem[]) => setWatchlist(Array.isArray(data) ? data : []))
      .catch(() => setWatchlist([]));
  }, []);

  useEffect(() => {
    if (!watchlist.length) return;
    const symbols = watchlist.slice(0, 6);
    Promise.allSettled(
      symbols.map((item) =>
        fetch(`${API}/market/overview`)
          .then((r) => r.json())
          .then((d: { stocks?: LiveQuote[]; crypto?: LiveQuote[]; indianStocks?: LiveQuote[]; forex?: LiveQuote[] }) => {
            const all: LiveQuote[] = [
              ...(d.stocks ?? []),
              ...(d.crypto ?? []),
              ...(d.indianStocks ?? []),
              ...(d.forex ?? [])
            ];
            return { item, all };
          })
      )
    ).then((results) => {
      const map: Record<string, LiveQuote> = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          const match = r.value.all.find(
            (q) => q.symbol.toUpperCase() === r.value.item.symbol.toUpperCase()
          );
          if (match) map[r.value.item.symbol] = match;
        }
      });
      setLiveQuotes(map);
    });
  }, [watchlist]);

  const todaySignals = signals.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;
  const avgConf =
    signals.length > 0
      ? Math.round(signals.reduce((a, s) => a + (s.confidence ?? 0), 0) / signals.length)
      : 0;
  const latestSignal = signals[0] ?? null;

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
        eyebrow="Mission Control"
        title="Trading intelligence terminal"
        description="Monitor live scanner output, technical confluence setups, and global market pulse."
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Signals Today"
          value={statsLoading ? "…" : String(todaySignals)}
          hint="Live scanner matches"
        />
        <StatCard
          label="Total Insights"
          value={statsLoading ? "…" : String(signals.length)}
          hint="Historical analysis"
        />
        <StatCard
          label="Avg Confidence"
          value={statsLoading ? "…" : signals.length ? `${avgConf}%` : "—"}
          hint="Signal quality score"
        />
        <StatCard
          label="Watchlist"
          value={String(watchlist.length || "—")}
          hint="Tracked assets"
        />
      </div>

      <motion.div variants={itemVariants} className="mt-10">
        <LiveMarketOverview />
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <motion.div variants={itemVariants} className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                <BarChart className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white">Latest Intelligence</h3>
            </div>
            {latestSignal && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                REC: {new Date(latestSignal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {statsLoading ? (
            <div className="flex items-center gap-3 py-10 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin text-accent" /> SYNCHRONIZING REAL-TIME DATA…
            </div>
          ) : !latestSignal ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 italic">Analytical data is currently offline. Initialise a scan to proceed.</p>
              <Link href="/upload" className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-6 py-2.5 text-xs font-black tracking-widest text-accent hover:bg-accent/20 transition-all">
                LAUNCH SCANNER <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="font-heading text-3xl font-black tracking-tight text-white uppercase">
                    {latestSignal.symbol ?? latestSignal.market}
                  </h2>
                  <div className={clsx(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black tracking-widest",
                    latestSignal.direction?.toLowerCase().includes("long") || latestSignal.direction?.toLowerCase().includes("buy") 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  )}>
                    {latestSignal.direction?.toUpperCase()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-3xl font-black text-accent">{latestSignal.confidence}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Confidence</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Entry" value={fmt(latestSignal.entry_price)} hint="Optimum level" />
                <StatCard label="Stop" value={fmt(latestSignal.stop_loss)} hint="Risk floor" />
                <StatCard label="Target" value={fmt(latestSignal.take_profit)} hint="Primary TP" />
                <StatCard label="RR Ratio" value={latestSignal.risk_reward ? `${fmt(latestSignal.risk_reward)}x` : "—"} hint="Efficiency" />
              </div>

              {latestSignal.summary && (
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
                  <p className="text-sm font-medium leading-relaxed text-slate-400 antialiased italic">
                    &quot;{latestSignal.summary}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Watchlist Pulse */}
        <motion.div variants={itemVariants} className="glass-card p-8">
          <div className="flex items-center gap-2 mb-8">
            <h3 className="font-heading text-lg font-bold text-white">Watchlist Pulse</h3>
          </div>
          <div className="space-y-4">
            {watchlist.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No assets currently under surveillance.</p>
            ) : (
              watchlist.slice(0, 5).map((item) => {
                const q = liveQuotes[item.symbol];
                const isUp = q ? q.changePercent >= 0 : null;
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 transition-all hover:bg-white/[0.05]">
                    <div>
                      <div className="font-heading text-sm font-bold tracking-tight text-white">{item.symbol}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">{item.market}</div>
                    </div>
                    <div className="text-right font-heading">
                      {q ? (
                        <>
                          <div className="text-sm font-bold text-white">{fmt(q.price)}</div>
                          <div className={clsx("text-[10px] font-black", isUp ? "text-emerald-400" : "text-red-400")}>
                            {isUp ? "+" : ""}{q.changePercent.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div className="h-4 w-4 animate-pulse rounded-full bg-white/5" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
