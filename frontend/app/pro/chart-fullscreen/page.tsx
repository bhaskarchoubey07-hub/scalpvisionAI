"use client";

import React, { useState } from "react";
import TradingViewChart from "@/components/pro/Trading/TradingViewChart";
import { X, Search } from "lucide-react";
import Link from "next/link";

export default function ChartFullscreenPage() {
  const [symbol, setSymbol] = useState("NSE:RELIANCE");

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      {/* Floating Header */}
      <div className="absolute top-4 left-4 z-[100] flex items-center gap-4">
        <div className="flex bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 p-1 shadow-2xl">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSymbol((e.target as HTMLInputElement).value.toUpperCase());
                }}
                className="bg-transparent pl-10 pr-4 py-2 text-xs font-bold text-white focus:outline-none w-32 focus:w-48 transition-all"
              />
           </div>
        </div>
        
        <div className="px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-[10px] font-black text-indigo-400 uppercase tracking-widest backdrop-blur-md">
           {symbol} • Institutional Terminal
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[100]">
        <Link 
          href="/pro/chart"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/30 transition-all backdrop-blur-md group"
          title="Exit Fullscreen (ESC)"
        >
          <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      <div className="w-full h-full">
         <TradingViewChart symbol={symbol} />
      </div>

      {/* Logic to handle ESC key */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') window.location.href = '/pro/chart';
        });
      `}} />
    </div>
  );
}
