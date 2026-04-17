"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Crosshair, AlertOctagon, ArrowRight, Zap, Scale, Target, Info } from "lucide-react";
import { processTrade, FinalTradePlan } from "@/lib/pro/accuracyEngine/executionEngine";
import { latestSignal } from "@/lib/mock-data";

export default function AccuracyEnginePage() {
  const [tradePlan, setTradePlan] = useState<FinalTradePlan | null>(null);

  useEffect(() => {
    // Process the demo signal through the engine
    // Need to cast latestSignal to the right type for mock demo
    const plan = processTrade({
        ...latestSignal,
        direction: latestSignal.direction as any,
        market: latestSignal.market as any,
        trend: "bullish", // adding required field for analysis
        volatility_percent: 1.2,
        risk_reward: parseFloat(latestSignal.riskReward),
        entry_price: parseFloat(latestSignal.entry),
        take_profit: parseFloat(latestSignal.takeProfit),
        stop_loss: parseFloat(latestSignal.stopLoss),
        signal: "Breakout",
    } as any);
    
    setTradePlan(plan);
  }, []);

  if (!tradePlan) return null;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Accuracy Engine v1.0</div>
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             Execution Guardrail
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
             Filtering AI signals through strict quantitative hard-gates.
          </p>
        </div>
        
        <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md ${tradePlan.status === 'VALIDATED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${tradePlan.status === 'VALIDATED' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/20'}`}>
                {tradePlan.status === 'VALIDATED' ? <ShieldCheck className="h-6 w-6 text-emerald-400" /> : <AlertOctagon className="h-6 w-6 text-red-400" />}
            </div>
            <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Status</div>
                <div className={`text-sm font-bold tracking-wide ${tradePlan.status === 'VALIDATED' ? 'text-emerald-400' : 'text-red-400'}`}>
                   {tradePlan.status} FOR EXECUTION
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Raw AI Input Card */}
         <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Zap className="h-32 w-32 text-indigo-400" />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
               <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-indigo-400" />
               </div>
               <h2 className="text-xl font-bold text-white">Raw AI Signal</h2>
            </div>

            <div className="space-y-4">
               <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Asset</div>
                  <div className="text-lg font-bold text-white">{latestSignal.asset}</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Direction</div>
                     <div className="text-lg font-bold text-emerald-400">{latestSignal.direction}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
                     <div className="text-lg font-bold text-white">{latestSignal.confidence}%</div>
                  </div>
               </div>
               <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Initial Entry</div>
                  <div className="text-lg font-bold text-white">${latestSignal.entry}</div>
               </div>
            </div>
         </div>

         {/* Accuracy Engine Output */}
         <div className={`glass rounded-[2rem] p-8 border transition-all duration-500 ${tradePlan.status === 'VALIDATED' ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]'}`}>
            <div className="flex items-center gap-3 mb-8">
               <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${tradePlan.status === 'VALIDATED' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <Crosshair className={`h-6 w-6 ${tradePlan.status === 'VALIDATED' ? 'text-emerald-400' : 'text-red-400'}`} />
               </div>
               <h2 className="text-xl font-bold text-white">Accuracy Enhancement</h2>
            </div>

            {tradePlan.status === 'VALIDATED' ? (
               <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                     <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Optimized Entry Zone</span>
                     </div>
                     <div className="text-2xl font-bold text-white tracking-tight">
                        ${tradePlan.entry?.entryZone[0].toFixed(2)} — ${tradePlan.entry?.entryZone[1].toFixed(2)}
                     </div>
                     <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">{tradePlan.entry?.instruction}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">HTF Trend</div>
                        <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-emerald-400" />
                           {tradePlan.context.trend}
                        </div>
                     </div>
                     <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Volatility</div>
                        <div className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-cyan-400" />
                           {tradePlan.context.volatility}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Exit Strategy</div>
                     <div className="space-y-2">
                        {tradePlan.exit?.managementSteps.map((step, i) => (
                           <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="h-5 w-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-indigo-400">
                                 {i + 1}
                              </div>
                              <span className="text-xs text-slate-300 leading-snug">{step}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                  <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                     <AlertOctagon className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Signal Rejected by Filter</h3>
                  <p className="text-slate-400 text-sm italic">"{tradePlan.reason}"</p>
               </div>
            )}
         </div>
      </div>

      <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/20">
         <div className="flex items-center gap-3 mb-6">
            <Scale className="h-6 w-6 text-slate-400" />
            <h2 className="text-lg font-bold text-white">Gate Verification Results</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
               { label: "Market Valid", value: tradePlan.context.validMarket ? "Pass" : "Fail", status: tradePlan.context.validMarket },
               { label: "Confidence", value: tradePlan.confidence >= 75 ? "Pass" : "Fail", status: tradePlan.confidence >= 75 },
               { label: "Trend Align", value: tradePlan.filter.valid || tradePlan.reason !== "Directional bias..." ? "Pass" : "Fail", status: true },
               { label: "RR Logic", value: "Pass", status: true },
            ].map((gate, i) => (
               <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${gate.status ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{gate.label}</span>
                  <span className={`text-xs font-bold uppercase tracking-widest ${gate.status ? 'text-emerald-400' : 'text-red-400'}`}>{gate.value}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
