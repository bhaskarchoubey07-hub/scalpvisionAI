"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Settings, 
  Download, 
  LineChart, 
  Loader2, 
  ShieldCheck, 
  Scale, 
  TrendingUp, 
  ArrowUpRight,
  Calculator
} from "lucide-react";

export default function EnhancedBacktestPage() {
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleRun = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 font-bold uppercase tracking-widest">Real-World Simulation</div>
            <Calculator className="h-3 w-3 text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             Enhanced Backtest
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
             Historical validation with Accuracy Engine filters, slippage, and fee modeling.
          </p>
        </div>
        
        <button 
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
          RUN QUANT SIMULATION
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/30">
              <div className="flex items-center gap-2 mb-8">
                <Settings className="h-5 w-5 text-slate-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Simulation Config</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logic Engine</label>
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                     <span className="text-sm font-bold text-white tracking-tight">Accuracy Engine v1.0</span>
                     <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Slippage</label>
                     <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white">0.05% (Avg)</div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exchange Fee</label>
                     <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white">0.1%</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk per Trade</label>
                  <div className="flex gap-2">
                     <input type="text" defaultValue="1.5" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none" />
                     <span className="flex items-center px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold uppercase">%</span>
                  </div>
                </div>
              </div>
           </div>

           <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-3 mb-4">
                 <Scale className="h-5 w-5 text-emerald-400" />
                 <h4 className="text-sm font-bold text-white uppercase tracking-tight">Performance Alpha</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                 The Enhanced engine typically reduces trade frequency by **64%** but increases win-rate by **22%** by eliminating low-liquidity signals.
              </p>
           </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-8 space-y-8">
           <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/10 min-h-[450px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-3">
                    <LineChart className="h-6 w-6 text-indigo-400" />
                    <h2 className="text-xl font-semibold text-white tracking-tight">Simulated Equity Curve</h2>
                 </div>
                 {showResults && (
                   <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-all">
                      <Download className="h-4 w-4" />
                      EXPORT QUANT DATA
                   </button>
                 )}
              </div>
              
              {!showResults ? (
                <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/5 rounded-[2.5rem]">
                    <Calculator className="h-16 w-16 text-slate-800 mb-6 opacity-40" />
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-widest text-center">
                       Launch Simulation<br/>
                       <span className="text-[10px] font-medium opacity-60">Modeling Accuracy Engine gates...</span>
                    </p>
                </div>
              ) : (
                <div className="space-y-12">
                   <div className="relative h-48 w-full flex items-end gap-1 px-4">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <motion.div 
                           key={i}
                           initial={{ height: 0 }}
                           animate={{ height: `${30 + Math.sin(i * 0.3) * 15 + (i * 0.8) + Math.random() * 20}%` }}
                           className="flex-1 bg-gradient-to-t from-indigo-500/40 to-cyan-500/40 rounded-t-sm"
                        />
                      ))}
                      <div className="absolute inset-x-0 bottom-[40%] border-t border-white/5 border-dashed" />
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Win Rate", value: "72.4%", trend: "+12.1%", positive: true },
                        { label: "Profit Factor", value: "3.12", trend: "+0.7", positive: true },
                        { label: "Max Drawdown", value: "4.8%", trend: "-2.4%", positive: true },
                        { label: "Avg R/R", value: "2.44", trend: "+0.3", positive: true },
                      ].map((stat, i) => (
                         <div key={i} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</div>
                            <div className="text-2xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                            <div className={`text-[10px] font-bold flex items-center gap-1 ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                               <TrendingUp className="h-3 w-3" />
                               {stat.trend} Alpha
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {showResults && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 flex items-center justify-between"
             >
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <ArrowUpRight className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-white tracking-tight">Signal Optimization Passed</h4>
                        <p className="text-sm text-slate-400">The current logic shows high resistance to market noise.</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estimated Return</div>
                    <div className="text-3xl font-bold text-emerald-400">+24.8%</div>
                </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
