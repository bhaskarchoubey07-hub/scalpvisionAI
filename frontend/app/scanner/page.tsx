"use client";

import React, { useState, useEffect } from "react";
import { SectionHeader } from "@/components/section-header";
import { fetchMarketScan, type ScanResult } from "@/lib/api";
import { Search, Loader2, ArrowUpRight, ArrowDownRight, Compass, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function ScannerPage() {
  const [market, setMarket] = useState<"stock" | "crypto" | "indian-stock" | "forex">("stock");
  const [filter, setFilter] = useState<"momentum" | "breakout" | "reversal" | "probability" | "scalp" | "delivery">("probability");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  const scan = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await fetchMarketScan(token, market, filter, "1d");
      setResults(data);
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scan();
  }, [market, filter]);

  return (
    <div className="grid-shell py-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <SectionHeader
          eyebrow="Market Radar"
          title="Confluence Scanner"
          description="Scan multi-asset universes for high-probability setups and volume breakouts."
        />
        <button
          onClick={scan}
          className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-black shadow-glow hover:scale-105 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : "Refresh Scan"}
        </button>
      </div>

      {/* Control Panel */}
      <div className="glass rounded-[2rem] p-8 border border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Asset Universe</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "stock", label: "US Equities" },
                { key: "crypto", label: "Cryptocurrency" },
                { key: "indian-stock", label: "Indian Equities" },
                { key: "forex", label: "Forex Pairs" }
              ].map((u) => (
                <button
                  key={u.key}
                  onClick={() => setMarket(u.key as any)}
                  className={clsx(
                    "px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    market === u.key 
                      ? "bg-white/10 text-white border border-white/20" 
                      : "bg-white/[0.02] text-slate-500 border border-white/5 hover:text-slate-300"
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Scan Filter Strategy</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "probability", label: "Highest Probability" },
                { key: "momentum", label: "Momentum Swing" },
                { key: "breakout", label: "Volatility Breakout" },
                { key: "reversal", label: "Trend Reversal" },
                { key: "scalp", label: "Micro Scalp" },
                { key: "delivery", label: "Position Delivery" }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={clsx(
                    "px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    filter === f.key
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-white/[0.01] text-slate-500 border border-white/5 hover:text-slate-300"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : results.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-white/5 flex items-center justify-center">
            <Compass className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No scanner signals matching this criteria</p>
        </div>
      ) : (
        <div className="glass rounded-[2rem] overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">Ticker</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-center">Direction</th>
                  <th className="px-6 py-4 text-right">Model Confidence</th>
                  <th className="px-6 py-4 text-right">RSI (14)</th>
                  <th className="px-6 py-4 text-left">Confluence Pattern</th>
                  <th className="px-6 py-4 text-left">Macro Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {results.map((r, idx) => (
                  <motion.tr
                    key={r.symbol}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-white font-black tracking-wider font-heading uppercase">{r.symbol.replace(".NS", "")}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{market.replace("-", " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-mono font-bold text-slate-300">
                      {market === "indian-stock" ? "₹ " : "$ "}{r.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={clsx(
                        "rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider",
                        r.signal === "BUY" ? "bg-accent/10 text-accent border border-accent/20" : r.signal === "SELL" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/5 text-slate-400 border border-white/10"
                      )}>
                        {r.signal}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-white font-bold">{r.confidence}%</td>
                    <td className="px-6 py-5 text-right font-mono text-slate-300">{r.rsi.toFixed(0)}</td>
                    <td className="px-6 py-5 text-left text-slate-400 text-xs font-semibold">{r.pattern}</td>
                    <td className="px-6 py-5 text-left">
                      <span className={clsx(
                        "text-xs font-bold uppercase tracking-wider flex items-center gap-1",
                        r.trend === "uptrend" ? "text-accent" : r.trend === "downtrend" ? "text-red-400" : "text-slate-500"
                      )}>
                        {r.trend === "uptrend" ? <ArrowUpRight className="h-3 w-3" /> : r.trend === "downtrend" ? <ArrowDownRight className="h-3 w-3" /> : null}
                        {r.trend}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
