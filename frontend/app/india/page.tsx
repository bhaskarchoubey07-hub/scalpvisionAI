"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { CandlesChart } from "@/components/candles-chart";
import { fetchCandles, type Candle } from "@/lib/api";

const nifty50 = [
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "LT.NS",
  "SBIN.NS",
  "BHARTIARTL.NS",
  "AXISBANK.NS",
  "ITC.NS",
  "HINDUNILVR.NS",
  "KOTAKBANK.NS",
  "BAJFINANCE.NS",
  "ASIANPAINT.NS",
  "MARUTI.NS",
  "SUNPHARMA.NS",
  "WIPRO.NS",
  "POWERGRID.NS",
  "ONGC.NS",
  "NTPC.NS",
  "M&M.NS",
  "TITAN.NS",
  "ULTRACEMCO.NS",
  "HCLTECH.NS",
  "JSWSTEEL.NS",
  "GRASIM.NS",
  "ADANIENT.NS",
  "ADANIPORTS.NS",
  "BAJAJFINSV.NS",
  "CIPLA.NS",
  "COALINDIA.NS",
  "DRREDDY.NS",
  "EICHERMOT.NS",
  "HEROMOTOCO.NS",
  "HDFCLIFE.NS",
  "DIVISLAB.NS",
  "BPCL.NS",
  "BRITANNIA.NS",
  "TECHM.NS",
  "HINDALCO.NS",
  "UPL.NS",
  "NESTLEIND.NS",
  "BAJAJ-AUTO.NS",
  "SHREECEM.NS",
  "SBILIFE.NS",
  "INDUSINDBK.NS",
  "TATASTEEL.NS",
  "APOLLOHOSP.NS",
  "TATAMOTORS.NS",
  "JSWSTEEL.NS"
];

export default function IndiaMarketPage() {
  const [symbol, setSymbol] = useState(nifty50[0]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCandles(symbol, "3mo", "1d");
        if (active) setCandles(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load chart data");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [symbol]);

  const latest = useMemo(() => candles.at(-1), [candles]);

  return (
    <div className="grid-shell py-8 space-y-8">
      <SectionHeader
        eyebrow="Indian Markets"
        title="NSE stocks with live candles"
        description="Browse NIFTY50 symbols and view recent daily candlesticks pulled from Yahoo Finance."
      />

      <div className="glass rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-400">Symbol</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
          >
            {nifty50.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {loading && <span className="text-xs text-slate-500">Loading...</span>}
          {error && <span className="text-xs text-red-300">{error}</span>}
          {latest && !loading && !error && (
            <div className="text-xs text-slate-400">
              Last close: <span className="text-white font-medium">{latest.close.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          {candles.length ? <CandlesChart candles={candles} /> : <div className="text-sm text-slate-400">No data.</div>}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Open</th>
                <th className="px-4 py-3 text-right">High</th>
                <th className="px-4 py-3 text-right">Low</th>
                <th className="px-4 py-3 text-right">Close</th>
              </tr>
            </thead>
            <tbody>
              {candles
                .slice(-30)
                .reverse()
                .map((c) => (
                  <tr key={c.time} className="border-t border-white/5 text-slate-200">
                    <td className="px-4 py-2">{new Date(c.time * 1000).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-2 text-right">{c.open.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{c.high.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{c.low.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{c.close.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
