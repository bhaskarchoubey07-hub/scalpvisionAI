"use client";

import React from "react";
import { Timer, CheckSquare, Square, ChevronRight, Zap } from "lucide-react";

interface Step {
  label: string;
  status: "complete" | "pending" | "current";
}

interface EntryTimingProps {
  steps: Step[];
  confirmation: string;
}

export default function EntryTimingEngine({ steps, confirmation }: EntryTimingProps) {
  return (
    <div className="glass rounded-3xl p-6 border border-white/5 bg-panel/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Timer className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Entry Timing Engine</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Execution Sequence</p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4 group">
            <div className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-all ${
              step.status === 'complete' ? 'bg-emerald-500/20 border-emerald-500/40' : 
              step.status === 'current' ? 'bg-indigo-500/20 border-indigo-500/40 animate-pulse' : 
              'bg-white/5 border-white/10'
            }`}>
              {step.status === 'complete' ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : 
               step.status === 'current' ? <Zap className="h-4 w-4 text-indigo-400" /> : 
               <Square className="h-4 w-4 text-slate-600" />}
            </div>
            
            <div className="flex-1">
              <div className="text-sm font-medium text-white group-hover:translate-x-1 transition-transform">{step.label}</div>
            </div>

            {i < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-slate-700" />
            )}
          </div>
        ))}

        <div className="mt-8 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
             <Zap className="h-12 w-12 text-indigo-400" />
          </div>
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Confirmation Logic</div>
          <p className="text-xs text-white font-medium relative z-10">{confirmation}</p>
        </div>
      </div>
    </div>
  );
}
