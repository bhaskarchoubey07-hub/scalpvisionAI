"use client";

import { motion } from "framer-motion";
import { BookOpen, Plus, Calendar, Tag, Search } from "lucide-react";

const journalEntries = [
  { date: "Oct 24, 2024", asset: "RELIANCE.NS", type: "LONG", pnl: "+₹4,200", outcome: "win", notes: "Breakout confirmed on M15 with high volume." },
  { date: "Oct 23, 2024", asset: "BTCUSDT", type: "SHORT", pnl: "-$120", outcome: "loss", notes: "Stop loss hit after unexpected volatility spike." },
  { date: "Oct 22, 2024", asset: "ETHUSDT", type: "LONG", pnl: "+$450", outcome: "win", notes: "RSI divergence played out perfectly." },
];

export default function JournalPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Trade Journal</h1>
          <p className="text-slate-400 mt-2">Log and analyze your performance with AI-enhanced insights.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-slate-950 font-bold shadow-glow hover:shadow-glow-lg transition-all active:scale-95">
          <Plus className="h-4 w-4" /> ADD ENTRY
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-4">
           <div className="glass rounded-2xl p-6 border border-white/5 bg-panel/40">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Search & Filters</div>
              <div className="space-y-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                    <input type="text" placeholder="Search notes..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none" />
                 </div>
                 <button className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white transition-all">
                    <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Date Range</span>
                 </button>
                 <button className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white transition-all">
                    <span className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> Strategy Tag</span>
                 </button>
              </div>
           </div>

           <div className="glass rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
              <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">AI Review</div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "You tend to over-leverage after losses. Focus on maintaining size consistency during drawdown phases."
              </p>
           </div>
        </div>

        {/* Entries List */}
        <div className="lg:col-span-3 space-y-4">
           {journalEntries.map((entry, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-6 border border-white/5 bg-panel/20 hover:bg-panel/30 transition-all cursor-pointer group"
              >
                 <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                       <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${
                         entry.outcome === 'win' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                       }`}>
                          <BookOpen className={`h-6 w-6 ${entry.outcome === 'win' ? 'text-emerald-400' : 'text-red-400'}`} />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-white uppercase">{entry.asset} • {entry.type}</div>
                          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{entry.date}</div>
                       </div>
                    </div>
                    <div className={`text-lg font-bold ${entry.outcome === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
                       {entry.pnl}
                    </div>
                 </div>
                 <p className="text-xs text-slate-400 line-clamp-2 group-hover:line-clamp-none transition-all">
                    {entry.notes}
                 </p>
              </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
}
