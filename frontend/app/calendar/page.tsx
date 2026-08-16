"use client";

import React, { useState, useEffect } from "react";
import { SectionHeader } from "@/components/section-header";
import { fetchEconomicCalendar, type CalendarEvent } from "@/lib/api";
import { Calendar, Loader2, Globe, TrendingUp, DollarSign, Rocket, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"all" | "macro" | "earnings" | "dividend" | "ipo">("all");

  useEffect(() => {
    const loadEvents = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const data = await fetchEconomicCalendar(token);
        setEvents(data);
      } catch (err) {
        console.error("Calendar fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const filteredEvents = category === "all" ? events : events.filter(e => e.category === category);

  const getIcon = (cat: string) => {
    if (cat === "macro") return <Globe className="h-4 w-4 text-accent" />;
    if (cat === "earnings") return <TrendingUp className="h-4 w-4 text-accent" />;
    if (cat === "dividend") return <DollarSign className="h-4 w-4 text-accent" />;
    return <Rocket className="h-4 w-4 text-accent" />;
  };

  return (
    <div className="grid-shell py-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <SectionHeader
          eyebrow="Market Schedule"
          title="Economic Calendar"
          description="Keep track of central bank interest rate meetings, inflation datasets, earnings announcements, and corporate dividends."
        />
      </div>

      {/* Filter Tabs */}
      <div className="glass rounded-[2rem] p-6 border border-white/5 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Schedules" },
          { key: "macro", label: "Macro & Fed/RBI" },
          { key: "earnings", label: "Earnings Reports" },
          { key: "dividend", label: "Dividends" },
          { key: "ipo", label: "IPO Listings" }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setCategory(t.key as any)}
            className={clsx(
              "px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              category === t.key
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/[0.01] text-slate-500 border border-white/5 hover:text-slate-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-white/5 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No scheduled events in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass rounded-[1.5rem] border border-white/5 p-6 hover:bg-white/[0.01] transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                    {getIcon(item.category)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide leading-snug">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span>Date: {item.date}</span>
                      {item.currency && (
                        <>
                          <span>•</span>
                          <span className="text-accent">{item.currency}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-slate-400">{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 md:gap-12">
                  {/* Forecast values */}
                  {item.expected && (
                    <div className="text-right min-w-[70px]">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Forecast</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{item.expected}</span>
                    </div>
                  )}
                  {item.previous && (
                    <div className="text-right min-w-[70px]">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-0.5">Previous</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{item.previous}</span>
                    </div>
                  )}

                  {/* Importance */}
                  <div className="flex items-center gap-2 min-w-[100px] justify-end">
                    <span className={clsx(
                      "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-wider border",
                      item.importance === "high"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : item.importance === "medium"
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-white/5 text-slate-500 border-white/10"
                    )}>
                      {item.importance} priority
                    </span>
                    {item.importance === "high" && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
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
