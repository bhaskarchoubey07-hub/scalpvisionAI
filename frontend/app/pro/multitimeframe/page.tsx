"use client";

import { motion } from "framer-motion";
import { Layers, Maximize2, RefreshCw } from "lucide-react";

export default function MultiTimeframePage() {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Multi-Timeframe Analysis</h1>
          <p className="text-slate-400 mt-2">Correlated view of asset behavior across multiple time windows.</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all">
             <RefreshCw className="h-4 w-4" /> SYNC ALL
           </button>
           <button className="p-2 rounded-xl bg-accent text-slate-950 font-bold">
             <Layers className="h-5 w-5" />
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full min-h-[600px]">
        {["M1", "M5", "M15", "H1", "H4", "D1"].map((tf, i) => (
          <div key={tf} className="glass rounded-3xl border border-white/5 bg-panel/30 flex flex-col overflow-hidden group">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest">{tf}</span>
                <span className="text-[10px] text-slate-500 font-medium">REAL-TIME</span>
              </div>
              <Maximize2 className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors cursor-pointer" />
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#030712]">
                <div className="flex flex-col items-center gap-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                </div>
            </div>
            <div className="p-4 bg-white/[0.03] border-t border-white/5 flex justify-between items-center">
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trend Alignment</div>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${i < 3 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                 {i < 3 ? "BULLISH" : "BEARISH"}
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
