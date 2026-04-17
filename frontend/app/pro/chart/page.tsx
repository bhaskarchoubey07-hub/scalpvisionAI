"use client";

import React, { useState } from "react";
import TradingViewChart from "@/components/pro/Trading/TradingViewChart";
import TradingDisclaimer from "@/components/pro/Trading/TradingDisclaimer";
import { Search, LineChart, Maximize2 } from "lucide-react";

export default function ChartPage() {
  const [symbol, setSymbol] = useState("NSE:RELIANCE");

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Live Market Intelligence</div>
             <LineChart className="h-3 w-3 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Live Intelligence Chart</h1>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Change Symbol (e.g. NSE:TCS)" 
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSymbol((e.target as HTMLInputElement).value.toUpperCase());
              }}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 relative group w-full min-h-0 container-fill">
        <TradingViewChart symbol={symbol} />
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-white backdrop-blur-md">
                <Maximize2 className="h-4 w-4" />
            </button>
        </div>
      </div>

      <TradingDisclaimer />
    </div>
  );
}
