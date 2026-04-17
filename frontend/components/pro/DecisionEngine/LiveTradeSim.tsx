"use client";

import React from "react";
import { TrendingUp, Target, ShieldOff, DollarSign, ArrowRightLeft } from "lucide-react";

interface TradeSimProps {
  entry: number;
  tp: number;
  sl: number;
  riskAmount: number;
}

export default function LiveTradeSim({ entry, tp, sl, riskAmount }: TradeSimProps) {
  const reward = tp - entry;
  const risk = entry - sl;
  const rr = (reward / risk).toFixed(2);
  const potentialProfit = (reward / risk) * riskAmount;

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 bg-panel/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Live Trade Simulation</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">PnL Projection</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
           <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                 <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Risk/Reward</div>
                 <div className="text-xl font-bold text-white">{rr} : 1</div>
              </div>
           </div>
           <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Proj. PnL</div>
              <div className="text-xl font-bold text-emerald-400">+${potentialProfit.toFixed(2)}</div>
           </div>
        </div>

        <div className="relative pt-4 pb-8 px-2">
           <div className="absolute left-0 right-0 h-1 bg-white/5 rounded-full top-1/2 -translate-y-1/2" />
           
           {/* Price Points */}
           <div className="flex justify-between items-center relative z-10 text-center">
              <div className="space-y-2">
                 <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Stop</div>
                 <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-white font-bold text-xs">{sl}</div>
              </div>
              <div className="space-y-2 translate-y-[-4px]">
                 <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Entry</div>
                 <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-white font-bold text-sm scale-110 shadow-lg shadow-indigo-500/20">{entry}</div>
              </div>
              <div className="space-y-2">
                 <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Target</div>
                 <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-white font-bold text-xs">{tp}</div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
           <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Max Risk</div>
              <div className="text-sm font-bold text-red-500/80">-${riskAmount}</div>
           </div>
           <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fee Estimate</div>
              <div className="text-sm font-bold text-slate-400">$2.40</div>
           </div>
        </div>
      </div>
    </div>
  );
}
