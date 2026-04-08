"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { History, Play, Settings, Download, LineChart, Loader2 } from "lucide-react";
import { runBacktest, BacktestResult } from "@/lib/api";

export default function BacktestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [strategy, setStrategy] = useState("Mean Reversion AI v2.4");
  const [range, setRange] = useState("Last 30 Days (High Density)");

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await runBacktest(strategy, range);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Logic Backtesting</h1>
          <p className="text-slate-400 mt-2">Validate AI signaling models against historical market cycles.</p>
        </div>
        <button 
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-slate-950 font-bold shadow-glow hover:shadow-glow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
          RUN SIMULATION
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config Panel */}
        <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/40 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Configuration</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strategy Template</label>
              <select 
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
              >
                <option>Mean Reversion AI v2.4</option>
                <option>Momentum Breakout v1.0</option>
                <option>Liquidty Sweep Engine</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Historical Range</label>
              <select 
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
              >
                <option>Last 30 Days (High Density)</option>
                <option>Last 6 Months</option>
                <option>2023 Full Cycle</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Capital</label>
              <div className="flex gap-2">
                 <input type="text" defaultValue="10,000" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none" />
                 <span className="flex items-center px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold uppercase">USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/10 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <LineChart className="h-6 w-6 text-accent" />
                    <h2 className="text-xl font-semibold text-white">Equity Curve</h2>
                 </div>
                 {results && (
                   <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-colors">
                      <Download className="h-4 w-4" />
                   </button>
                 )}
              </div>
              
              {!results ? (
                <div className="flex items-center justify-center h-64 border border-dashed border-white/5 rounded-3xl">
                   <div className="flex flex-col items-center gap-4 text-slate-700">
                      <History className="h-12 w-12 opacity-20" />
                      <p className="text-sm font-medium opacity-40 uppercase tracking-widest text-center">Select Configuration<br/>to generate equity curve</p>
                   </div>
                </div>
              ) : (
                <div className="relative h-64 w-full flex items-end gap-1 px-4">
                   {/* Simulated Chart Visualization */}
                   {Array.from({ length: 40 }).map((_, i) => (
                     <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${20 + Math.sin(i * 0.5) * 10 + Math.random() * 60}%` }}
                        className="flex-1 bg-accent/20 rounded-t-sm"
                     />
                   ))}
                   <div className="absolute inset-x-0 top-1/2 border-t border-accent/20 border-dashed" />
                </div>
              )}
           </div>

           <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Net Profit", value: results ? `$${results.net_profit}` : "$0.00", color: "text-emerald-400" },
                { label: "Max Drawdown", value: results ? `${results.max_drawdown}%` : "0.0%", color: "text-red-400" },
                { label: "Sharpe Ratio", value: results ? results.sharpe_ratio : "0.00", color: "text-indigo-400" },
              ].map(res => (
                 <div key={res.label} className="glass rounded-2xl p-6 border border-white/5 bg-panel/30">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{res.label}</div>
                    <div className={`text-xl font-bold ${res.color}`}>{res.value}</div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
