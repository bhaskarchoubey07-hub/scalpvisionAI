"use client";

import { motion } from "framer-motion";
import { Brain, ShieldCheck, AlertCircle, Info } from "lucide-react";

export default function ConfidencePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Confidence Engine</h1>
        <p className="text-slate-400 mt-2">Quantitative conviction levels based on multi-factor alignment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conviction breakdown card */}
        <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Factor Distribution</h2>
          </div>

          <div className="space-y-6">
            {[
              { factor: "Trend Alignment", weight: "40%", score: 92 },
              { factor: "Volume Confirmation", weight: "25%", score: 78 },
              { factor: "Relative Strength", weight: "20%", score: 85 },
              { factor: "Market Sentiment", weight: "15%", score: 64 },
            ].map((f, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-400">{f.factor}</span>
                  <span className="text-white">{f.score}/100</span>
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

          <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-emerald-400 mt-1" />
              <div>
                <div className="text-sm font-bold text-white mb-1">High Conviction Signal Verified</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The current setup has passed all validation filters with a composite score of 84.7.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Explainability pane */}
        <div className="space-y-6">
          <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/20">
            <div className="flex items-center gap-3 mb-6">
               <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Info className="h-6 w-6 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">AI Contextual Reasoning</h2>
            </div>
            <div className="prose prose-invert prose-sm">
              <p className="text-slate-400 leading-relaxed">
                "The algorithm detected a <span className="text-white font-medium">bullish divergence</span> on the H1 timeframe while the D1 trend remains firmly above the 200 EMA. 
                Volume profile indicates a POC (Point of Control) cluster just below current price, providing a high-probability liquidity floor."
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Bullish Divergence', 'POC Cluster', 'EMA 200 Support', 'Volatility Squeeze'].map(tag => (
                   <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                     {tag}
                   </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 border border-white/5 bg-panel/20 flex items-center gap-4">
             <div className="h-12 w-12 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                <div className="absolute inset-0 border-t-4 border-amber-500 rounded-full rotate-45" />
                <span className="text-sm font-bold text-white">S3</span>
             </div>
             <div>
                <div className="text-sm font-bold text-white">Volatility Warning</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Dynamic Risk Adjustment: Moderate</div>
             </div>
             <AlertCircle className="h-5 w-5 text-amber-500 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
