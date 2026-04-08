"use client";

import { motion } from "framer-motion";
import { Zap, Filter, Search, MoreHorizontal } from "lucide-react";

export default function SignalsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Advanced AI Signals</h1>
          <p className="text-slate-400 mt-2">Proprietary logic signals with multi-vector confirmation.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter Tickers..." 
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-white/5 bg-panel/20 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conviction</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              { asset: "RELIANCE.NS", type: "LONG", entry: "2942.50", target: "2985.00", conv: "92%", status: "Active" },
              { asset: "BTCUSDT", type: "SHORT", entry: "64210.00", target: "63100.00", conv: "87%", status: "Pending" },
              { asset: "HDFCBANK.NS", type: "LONG", entry: "1675.20", target: "1710.00", conv: "76%", status: "Hit" },
              { asset: "ETHUSDT", type: "LONG", entry: "3450.00", target: "3600.00", conv: "89%", status: "Active" },
            ].map((sig, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-white uppercase">{sig.asset}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${sig.type === "LONG" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {sig.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400 font-mono">{sig.entry}</td>
                <td className="px-6 py-4 text-sm text-slate-300 font-mono font-medium">{sig.target}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
                      <div className="h-full bg-accent" style={{ width: sig.conv }} />
                    </div>
                    <span className="text-xs font-bold text-white">{sig.conv}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                    sig.status === "Active" ? "border-indigo-500/30 text-indigo-400 bg-indigo-500/5" : 
                    sig.status === "Hit" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : 
                    "border-amber-500/30 text-amber-400 bg-amber-500/5"
                  }`}>
                    {sig.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-600 hover:text-white transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
