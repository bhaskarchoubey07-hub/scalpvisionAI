"use client";

import React from "react";
import { Zap, ShieldCheck, ArrowRight, Layers, Layout, Target } from "lucide-react";

interface Feature {
  label: string;
  raw: string | boolean;
  enhanced: string | boolean;
}

export default function SignalComparison() {
  const features: Feature[] = [
    { label: "Confidence", raw: "82%", enhanced: "87.4% (Precision)" },
    { label: "Trend Validation", raw: "Standard EMA", enhanced: "Multi-factor AI Context" },
    { label: "Volume Profile", raw: "Static", enhanced: "Dynamic Absorption Analysis" },
    { label: "Execution Logic", raw: "Limit Order", enhanced: "Retest + Confirmation" },
    { label: "Risk Mitigation", raw: "Fixed SL", enhanced: "Dynamic ATR-based SL" },
  ];

  return (
    <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/30">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-glow">
          <Layers className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Intelligence Delta</h3>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Raw Signal vs Enhanced Intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {features.map((f, i) => (
          <div key={i} className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
            <div className="w-1/3 text-xs font-bold text-slate-400 uppercase tracking-tight">{f.label}</div>
            
            <div className="flex-1 flex items-center justify-between px-8">
               <div className="text-sm text-slate-500 italic opacity-60 line-through decoration-slate-700">{f.raw}</div>
               <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-indigo-500 transition-colors" />
               <div className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {f.enhanced}
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border border-white/10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <Target className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
               <div className="text-sm font-bold text-white">Advanced Decisioning Active</div>
               <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enhanced precision filter: Enabled</div>
            </div>
         </div>
         <div className="flex -space-x-2">
            {[1,2,3].map(i => (
                <div key={i} className="h-8 w-8 rounded-full border border-[#030712] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    AI
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}
