"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, ShieldCheck, Zap, Info } from "lucide-react";
import MarketContextEngine from "@/components/pro/DecisionEngine/MarketContextEngine";
import NoTradeZoneDetector from "@/components/pro/DecisionEngine/NoTradeZoneDetector";
import EntryTimingEngine from "@/components/pro/DecisionEngine/EntryTimingEngine";
import ConfidenceBreakdown from "@/components/pro/DecisionEngine/ConfidenceBreakdown";
import LiveTradeSim from "@/components/pro/DecisionEngine/LiveTradeSim";
import SignalComparison from "@/components/pro/DecisionEngine/SignalComparison";

export default function DecisionEnginePage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Enterprise Intelligence</div>
            <Sparkles className="h-3 w-3 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            Advanced Decision Engine
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            High-precision filters and quantitative execution intelligence.
          </p>
        </div>
        
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Status</div>
                <div className="text-sm font-bold text-white tracking-wide">AI Precision Filter: Active</div>
            </div>
        </div>
      </div>

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Context & Filter */}
        <div className="lg:col-span-4 space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <MarketContextEngine 
                    trend="Bullish" 
                    volatility="Normal" 
                    strength={78} 
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <NoTradeZoneDetector 
                    status="Trade" 
                    reason="Market exhibiting healthy liquidity absorption and structural higher-lows. Volume delta supports directional bias." 
                    risks={[
                        "Impeding supply zone at 65.4k",
                        "Lower than average session volume",
                        "DXY local strength rebound"
                    ]}
                />
            </motion.div>
        </div>

        {/* Center Column: Execution & Confidence */}
        <div className="lg:col-span-4 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <EntryTimingEngine 
                    steps={[
                        { label: "Impulse Setup Detected", status: "complete" },
                        { label: "Pullback to 0.618 Fib Reached", status: "complete" },
                        { label: "Retest of Breakout Zone", status: "current" },
                        { label: "M5 Engulfing Confirmation", status: "pending" }
                    ]}
                    confirmation="Wait for M5 candle close above 64,820 with volume expansion for optimal RR."
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <ConfidenceBreakdown 
                    score={87} 
                    factors={[
                        { name: "Global Trend Alignment", score: 92, weight: 40 },
                        { name: "Orderflow Delta Bias", score: 78, weight: 30 },
                        { name: "Multi-Timeframe Concordance", score: 84, weight: 20 },
                        { name: "Sentiment Sentiment", score: 95, weight: 10 }
                    ]}
                />
            </motion.div>
        </div>

        {/* Right Column: Sim & Comparison */}
        <div className="lg:col-span-4 space-y-8">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <LiveTradeSim 
                    entry={64250.00} 
                    tp={65980.00} 
                    sl={63640.00} 
                    riskAmount={500} 
                />
            </motion.div>

            <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20">
                <div className="flex items-center gap-3 mb-4">
                    <Info className="h-5 w-5 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Intelligence Note</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                    "The current setup presents a high-conviction momentum play. The Decision Engine has filtered out 3 false breakouts in the last 4 hours, identifying this as the first validated re-entry."
                </p>
            </div>
        </div>
      </div>

      {/* Bottom Comparison Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <SignalComparison />
      </motion.div>
    </div>
  );
}
