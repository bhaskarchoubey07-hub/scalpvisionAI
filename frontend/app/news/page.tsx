"use client";

import React, { useState, useEffect } from "react";
import { SectionHeader } from "@/components/section-header";
import { fetchMarketNews, type NewsItem } from "@/lib/api";
import { Newspaper, Loader2, Search, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function NewsPage() {
  const [symbol, setSymbol] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await fetchMarketNews(token, searchTerm || undefined);
      setNews(data);
    } catch (err) {
      console.error("Failed to load news", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(symbol.trim().toUpperCase());
  };

  return (
    <div className="grid-shell py-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <SectionHeader
          eyebrow="News Diagnostics"
          title="Sentiment & News Intelligence"
          description="AI-powered news parser extracting market impact scores and entities from international feeds."
        />
        
        {/* Search Ticker */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-sm w-full md:w-80">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Search by symbol (e.g. AAPL)"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-5 pr-12 text-sm text-white focus:border-accent/40 focus:outline-none"
          />
          <button type="submit" className="absolute right-3 p-2 text-slate-400 hover:text-accent transition-colors">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : news.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-white/5 flex items-center justify-center">
            <Newspaper className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No news updates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {news.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass rounded-[2rem] border border-white/5 p-8 flex flex-col justify-between hover:scale-[1.01] transition-all"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  {/* Sentiment Badge */}
                  <span className={clsx(
                    "rounded-xl px-4 py-1 text-[10px] font-black uppercase tracking-wider border",
                    item.sentiment === "positive" 
                      ? "bg-accent/10 text-accent border-accent/20" 
                      : item.sentiment === "negative" 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-white/5 text-slate-400 border-white/10"
                  )}>
                    {item.sentiment}
                  </span>

                  <span className="text-[10px] text-slate-500 font-bold">
                    {new Date(item.pubDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>

                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-lg font-heading font-black tracking-wide text-white hover:text-accent transition-colors uppercase leading-tight"
                >
                  {item.title}
                </a>

                <p className="text-xs text-slate-400 leading-relaxed font-bold">
                  {item.summary}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                {/* Entities */}
                <div className="flex gap-2">
                  {item.entities.map(e => (
                    <span 
                      key={e} 
                      onClick={() => { setSymbol(e); setSearchTerm(e); }}
                      className="px-3 py-1 rounded-lg bg-white/5 text-[9px] font-black tracking-wider text-slate-400 uppercase cursor-pointer hover:bg-white/10 hover:text-white"
                    >
                      {e.replace(".NS", "")}
                    </span>
                  ))}
                </div>

                {/* Impact score */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Impact Score</span>
                    <span className="text-xs font-black text-white">{item.impactScore}/100</span>
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <Activity className={clsx(
                      "h-4 w-4",
                      item.impactScore > 70 ? "text-accent" : item.impactScore < 40 ? "text-red-400" : "text-slate-400"
                    )} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
