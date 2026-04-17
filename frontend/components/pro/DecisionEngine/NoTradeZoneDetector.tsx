"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";

interface NoTradeZoneProps {
  status: "Trade" | "No Trade";
  reason: string;
  risks: string[];
}

export default function NoTradeZoneDetector({ status, reason, risks }: NoTradeZoneProps) {
  const isTrade = status === "Trade";

  return (
    <div className={`glass rounded-3xl p-6 border transition-all duration-300 ${isTrade ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isTrade ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            {isTrade ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> : <XCircle className="h-6 w-6 text-red-400" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Quality Filter</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">No Trade Zone Detection</p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isTrade ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
          {status}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white mb-1 uppercase tracking-tight">System Verdict</div>
            <p className="text-sm text-slate-400 italic">"{reason}"</p>
          </div>
        </div>

        <div className="space-y-2">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Risk Factors</div>
           <div className="grid grid-cols-1 gap-2">
              {risks.map((risk, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70" />
                  <span className="text-[11px] text-slate-300">{risk}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
