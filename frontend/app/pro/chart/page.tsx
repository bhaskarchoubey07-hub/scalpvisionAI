"use client";

import React, { useState } from "react";
import TradingViewChart from "@/components/pro/Trading/TradingViewChart";
import TradingDisclaimer from "@/components/pro/Trading/TradingDisclaimer";
import FullscreenChart from "@/components/pro/Trading/FullscreenChart";
import { Search, LineChart, Maximize2, Expand } from "lucide-react";
import Link from "next/link";

export default function ChartPage() {
  const [symbol, setSymbol] = useState("NSE:RELIANCE");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Live Market Intelligence</div>
             <LineChart className="h-3 w-3 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Live Intelligence Chart</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Symbol..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSymbol((e.target as HTMLInputElement).value.toUpperCase());
              }}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all w-48"
            />
          </div>
          
          <Link
            href="/pro/chart-fullscreen"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
          >
            <Expand className="h-4 w-4" />
            Fullscreen
          </Link>
          
          <button 
            onClick={() => setIsOverlayOpen(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-white backdrop-blur-md"
            title="Open Overlay"
          >
             <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full relative">
        <TradingViewChart symbol={symbol} />
      </div>

      <FullscreenChart 
        symbol={symbol}
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
      />

      <TradingDisclaimer />
    </div>
  );
}
