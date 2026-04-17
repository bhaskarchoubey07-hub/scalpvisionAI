"use client";

import React from "react";
import { Brain, BarChart3, PieChart, Layers, Target } from "lucide-react";
import { motion } from "framer-motion";

interface Factor {
  name: string;
  score: number;
  weight: number;
}

interface ConfidenceBreakdownProps {
  score: number;
  factors: Factor[];
}

export default function ConfidenceBreakdown({ score, factors }: ConfidenceBreakdownProps) {
  return (
    <div className="glass rounded-3xl p-6 border border-white/5 bg-panel/20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Brain className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Confidence Breakdown</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Composite Scoring</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tighter">
          {score}<span className="text-xs text-slate-500">/100</span>
        </div>
      </div>

      <div className="space-y-6">
        {factors.map((f, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-white uppercase tracking-tight">{f.name}</span>
                 <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Weight: {f.weight}%</span>
              </div>
              <span className="text-xs font-bold text-indigo-400">{f.score}/100</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${f.score}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500" 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Signal Integrity</span>
         </div>
         <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold uppercase tracking-widest">High Concordance</span>
      </div>
    </div>
  );
}
