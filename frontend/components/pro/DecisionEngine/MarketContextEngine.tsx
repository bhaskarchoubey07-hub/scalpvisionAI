"use client";

import React from "react";
import { TrendingUp, TrendingDown, Activity, Zap, Compass } from "lucide-react";

interface MarketContextProps {
  trend: "Bullish" | "Bearish" | "Neutral";
  volatility: "High" | "Normal" | "Low";
  strength: number;
}

export default function MarketContextEngine({ trend, volatility, strength }: MarketContextProps) {
  return (
    <div className="glass rounded-3xl p-6 border border-white/5 bg-panel/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Compass className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Market Context Engine</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Environment Detection</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Trend Bias</span>
          </div>
          <div className="flex items-center gap-2">
            {trend === "Bullish" ? (
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            ) : trend === "Bearish" ? (
              <TrendingDown className="h-5 w-5 text-red-400" />
            ) : (
              <Zap className="h-5 w-5 text-amber-400" />
            )}
            <span className="text-xl font-bold text-white">{trend}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Volatility</span>
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2">
             <div className={`h-2 w-2 rounded-full ${volatility === 'High' ? 'bg-orange-500 animate-pulse' : volatility === 'Normal' ? 'bg-cyan-500' : 'bg-slate-500'}`} />
             {volatility}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>Directional Strength</span>
          <span className="text-cyan-400">{strength}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500" 
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
    </div>
  );
}
