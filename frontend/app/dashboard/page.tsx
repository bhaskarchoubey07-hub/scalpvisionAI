"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { LiveMarketOverview } from "@/components/live-market-overview";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

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

  // Load signals from backend
  useEffect(() => {
    fetch(`${API}/signals`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Signal[]) => setSignals(Array.isArray(data) ? data : []))
      .catch(() => setSignals([]))
      .finally(() => setStatsLoading(false));
  }, []);

  // Load watchlist (no auth needed for count display)
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

  // Fetch live prices for watchlist items
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

  // Computed stats from real signals
  const todaySignals = signals.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;
  const avgConf =
    signals.length > 0
      ? Math.round(signals.reduce((a, s) => a + (s.confidence ?? 0), 0) / signals.length)
      : 0;
  const latestSignal = signals[0] ?? null;

  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="Mission Control"
        title="Trading intelligence dashboard"
        description="Monitor live scanner output, recent AI predictions, and your strategy health from a single control surface."
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Signals Today"
          value={statsLoading ? "…" : String(todaySignals)}
          hint="From AI chart analysis"
        />
        <StatCard
          label="Total Signals"
          value={statsLoading ? "…" : String(signals.length)}
          hint="All-time AI signals"
        />
        <StatCard
          label="Avg Confidence"
          value={statsLoading ? "…" : signals.length ? `${avgConf}%` : "—"}
          hint="Across all signals"
        />
        <StatCard
          label="Active Watchlist"
          value={String(watchlist.length || "—")}
          hint="Symbols you're tracking"
        />
      </div>

      {/* Live Market Overview */}
      <div className="mt-8">
        <LiveMarketOverview />
      </div>

      {/* Latest Signal + Watchlist Pulse */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">

        {/* Latest Signal */}
        <div className="glass rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">Latest Signal</div>
            {latestSignal && (
              <span className="text-xs text-slate-500">
                {new Date(latestSignal.created_at).toLocaleString()}
              </span>
            )}
          </div>

          {statsLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading signals…
            </div>
          ) : !latestSignal ? (
            <div className="mt-4 text-sm text-slate-400">
              No signals yet.{" "}
              <a href="/upload" className="text-accent underline">
                Upload a chart
              </a>{" "}
              to generate your first signal.
            </div>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">
                  {latestSignal.symbol ?? latestSignal.market}
                </h2>
                <span
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    latestSignal.direction?.toLowerCase() === "long" ||
                    latestSignal.direction?.toLowerCase() === "buy"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {latestSignal.direction?.toLowerCase() === "long" ||
                  latestSignal.direction?.toLowerCase() === "buy" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {latestSignal.direction?.toUpperCase()}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Entry" value={fmt(latestSignal.entry_price)} hint="Suggested execution" />
                <StatCard label="Stop" value={fmt(latestSignal.stop_loss)} hint="Risk cap" />
                <StatCard label="Target" value={fmt(latestSignal.take_profit)} hint="Primary take profit" />
                <StatCard
                  label="Confidence"
                  value={latestSignal.confidence != null ? `${latestSignal.confidence}%` : "—"}
                  hint={latestSignal.risk_reward != null ? `RR ${fmt(latestSignal.risk_reward)}` : ""}
                />
              </div>
              {latestSignal.summary && (
                <div className="mt-4 rounded-2xl border border-white/10 p-4 text-sm text-slate-300">
                  {latestSignal.summary}
                </div>
              )}
            </>
          )}
        </div>

        {/* Watchlist Pulse */}
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Watchlist Pulse</div>
          {watchlist.length === 0 ? (
            <div className="mt-5 text-sm text-slate-500">
              No watchlist items.{" "}
              <a href="/watchlist" className="text-accent underline">
                Add symbols
              </a>{" "}
              to track them here.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {watchlist.slice(0, 6).map((item) => {
                const q = liveQuotes[item.symbol];
                const isUp = q ? q.changePercent >= 0 : null;
                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.symbol}</div>
                        <div className="text-xs capitalize text-slate-500">{item.market}</div>
                      </div>
                      <div className="text-right">
                        {q ? (
                          <>
                            <div className="text-sm font-medium">{fmt(q.price)}</div>
                            <div
                              className={`text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {isUp ? "+" : ""}
                              {q.changePercent.toFixed(2)}%
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-500">Loading…</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
