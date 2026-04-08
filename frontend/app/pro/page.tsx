"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Activity, 
  Target, 
  ShieldCheck, 
  ArrowUpRight,
  Monitor
} from "lucide-react";

const stats = [
  { label: "Win Rate", value: "68.4%", icon: Target, trend: "+2.1%", color: "text-green-400" },
  { label: "Avg Conviction", value: "82/100", icon: Activity, trend: "+5", color: "text-indigo-400" },
  { label: "Risk Score", value: "Low", icon: ShieldCheck, trend: "Stable", color: "text-cyan-400" },
  { label: "Profit Factor", value: "2.42", icon: TrendingUp, trend: "+0.12", color: "text-emerald-400" },
];

export default function ProDashboard() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">AI Intelligence Hub</h1>
        <p className="text-slate-400 mt-2">Real-time analysis and scalp conviction engine.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-3xl p-6 border border-white/5 bg-panel/40"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Wave */}
        <div className="lg:col-span-2 glass rounded-[2rem] p-8 border border-white/5 bg-panel/20 relative overflow-hidden h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white">Performance Wave</h2>
              <p className="text-sm text-slate-500">Cumulative accuracy over last 100 predictions</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          {/* Placeholder for Chart */}
          <div className="absolute inset-x-0 bottom-0 top-32 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4 text-slate-600">
                <Monitor className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium opacity-40 uppercase tracking-widest">Connect API for Live Stream</p>
             </div>
          </div>
        </div>

        {/* Signals Feed Snippet */}
        <div className="glass rounded-[2rem] p-8 border border-white/5 bg-panel/20">
          <h2 className="text-xl font-semibold text-white mb-6">High Conviction</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 text-xs font-bold">BTC</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Long Position</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">M15 • High Volatility</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-accent transition-colors" />
              </div>
            ))}
          </div>
          <button className="w-full mt-6 p-4 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            VIEW ALL SIGNALS
          </button>
        </div>
      </div>
    </div>
  );
}
