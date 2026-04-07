"use client";

import { useMarketOverview } from "@/hooks/use-market-overview";
import { useWatchlist } from "@/hooks/use-watchlist";
import Link from "next/link";
import clsx from "clsx";

const labels: Record<string, string> = {
  BTCUSDT: "Breakout watch",
  ETHUSDT: "Trend continuation",
  SOLUSDT: "Momentum expansion",
  BNBUSDT: "Range breakout",
  AAPL: "Opening range scalp",
  NVDA: "VWAP retest",
  TSLA: "Momentum spike",
  MSFT: "Pullback setup",
  "RELIANCE.NS": "NSE momentum leader",
  "TCS.NS": "Trend continuation setup",
  "INFY.NS": "Breakout retest",
  "HDFCBANK.NS": "Banking sector rotation",
  "EURUSD=X": "Macro range watch",
  "GBPUSD=X": "London session breakout",
  "USDINR=X": "Rupee volatility watch",
  "USDJPY=X": "BoJ reaction setup"
};

export function LiveWatchlist() {
  const { data, lastUpdated, isLoading } = useMarketOverview();
  const { items, remove, isAuthenticated, error } = useWatchlist();

  const quotes = [...(data?.crypto ?? []), ...(data?.stocks ?? []), ...(data?.indianStocks ?? []), ...(data?.forex ?? [])].filter((quote) =>
    items.some((item) => item.symbol === quote.symbol && item.market === quote.market)
  );

  return (
    <div>
      <div className="mb-4 text-xs text-slate-500">
        Auto-refresh is on every 10 seconds{lastUpdated ? `, last updated at ${new Date(lastUpdated).toLocaleTimeString()}` : ""}.
      </div>
      {!isAuthenticated ? (
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Log in or create an account to save symbols to your watchlist.
          <div className="mt-4 flex gap-3">
            <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
              Log in
            </Link>
            <Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate-950">
              Sign up
            </Link>
          </div>
        </div>
      ) : null}
      {error ? <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {quotes.map((item) => (
        <div key={item.symbol} className="glass rounded-[2rem] p-6 hover:border-accent/20 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-heading font-black tracking-widest text-white group-hover:text-accent transition-colors">{item.symbol.replace('.NS', '').replace('.BO', '')}</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {item.market === "crypto" ? "Crypto" : item.market === "stock" ? "US Stock" : item.market === "indian-stock" ? "NSE/BSE" : "Forex"}
              </p>
            </div>
            <div className={clsx(
              "text-xs font-bold px-2 py-1 rounded-lg",
              item.changePercent >= 0 ? "bg-accent/10 text-accent" : "bg-red-500/10 text-red-400"
            )}>
              {item.changePercent >= 0 ? "+" : ""}
              {item.changePercent.toFixed(2)}%
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-300 font-medium">{labels[item.symbol] ?? "Technical setup identified"}</p>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-slate-500">
              {item.market === "indian-stock" ? "₹" : "$"}
            </span>
            <span className="text-xl font-heading font-black text-white">
              {item.price.toLocaleString(item.market === "indian-stock" ? "en-IN" : "en-US", { 
                maximumFractionDigits: item.price > 100 ? 2 : 4 
              })}
            </span>
          </div>
          <button
            onClick={() => {
              const watchlistItem = items.find((entry) => entry.symbol === item.symbol && entry.market === item.market);
              if (watchlistItem) {
                void remove(watchlistItem.id);
              }
            }}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
          >
            Remove from list
          </button>
        </div>
      ))}
      {(isLoading || (isAuthenticated && !quotes.length)) && (
        <div className="glass rounded-[2rem] p-6 text-sm text-slate-400">
          {isAuthenticated ? "Your watchlist is empty. Add symbols from the dashboard." : "Loading live watchlist data..."}
        </div>
      )}
      </div>
    </div>
  );
}
