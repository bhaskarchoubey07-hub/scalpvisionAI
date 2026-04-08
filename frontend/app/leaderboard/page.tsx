"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/api";
import { RefreshCw, Trophy, Target, BarChart2, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid-shell py-8">
      <SectionHeader 
        eyebrow="Hall of Fame" 
        title="Top strategy performers" 
        description="Rank users by score, win rate, and sustained execution quality. Live data synchronized with trade predictions." 
      />
      
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <div className="glass rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <Trophy className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Value</span>
          </div>
          <div className="text-3xl font-black text-white">SYSTEM ACTIVE</div>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-tight font-bold">Live ranking engine</p>
        </div>
        <div className="glass rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Target className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Avg Accuracy</span>
          </div>
          <div className="text-3xl font-black text-white">68.2%</div>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-tight font-bold">Community average</p>
        </div>
        <div className="glass rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <BarChart2 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Global Vol.</span>
          </div>
          <div className="text-3xl font-black text-white">REAL-TIME</div>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-tight font-bold">Trade verification on</p>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-[2rem] border border-white/5 bg-panel/20">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-white uppercase tracking-tight">Active Rankings</h3>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-slate-500">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE REFRESH
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest italic">Calculating statistics...</p>
          </div>
        ) : error ? (
           <div className="p-20 text-center text-red-400 font-medium">
             Failed to synchronize leaderboard data: {error}
           </div>
        ) : entries.length === 0 ? (
          <div className="p-20 text-center text-slate-500 italic">
            No rankings available in current season.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">
                <tr>
                  <th className="px-8 py-5">Rank</th>
                  <th className="px-8 py-5">Trader</th>
                  <th className="px-8 py-5 text-right">Score</th>
                  <th className="px-8 py-5 text-right">Win Rate</th>
                  <th className="px-8 py-5 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {entries.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-white/[0.02] transition-all">
                    <td className="px-8 py-6">
                      <div className={clsx(
                        "flex h-7 w-7 items-center justify-center rounded-lg font-black text-[10px] border",
                        idx === 0 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        idx === 1 ? "bg-slate-300/10 border-slate-300/20 text-slate-300" :
                        idx === 2 ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                        "bg-white/5 border-white/10 text-slate-500"
                      )}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                          {entry.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{entry.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white">{entry.score.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] tracking-widest">
                        {entry.win_rate}%
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-slate-400">{entry.total_trades} TRADES</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
