"use client";

import React, { useState, useEffect } from "react";
import { fetchPopularIndianStocks, type IndianStock, addWatchlistItem } from "@/lib/api";
import { motion } from "framer-motion";
import { TrendingUp, Plus, CheckCircle2, IndianRupee } from "lucide-react";
import clsx from "clsx";

interface Props {
  onAdded?: () => void;
}

export function PopularIndianStocks({ onAdded }: Props) {
  const [stocks, setStocks] = useState<IndianStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPopularIndianStocks();
        setStocks(data);
      } catch (error) {
        console.error("Load popular stocks error:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = async (stock: IndianStock) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setAddingId(stock.yahoo_symbol);
    try {
      await addWatchlistItem(token, stock.yahoo_symbol, "indian-stock");
      setAddedId(stock.yahoo_symbol);
      setTimeout(() => setAddedId(null), 2000);
      if (onAdded) onAdded();
    } catch (error) {
      console.error("Add failed:", error);
    } finally {
      setAddingId(null);
    }
  };

  if (loading || stocks.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Popular in India</h3>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none">
        {stocks.map((stock) => (
          <motion.button
            key={stock.yahoo_symbol}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAdd(stock)}
            disabled={addingId === stock.yahoo_symbol || addedId === stock.yahoo_symbol}
            className={clsx(
              "flex shrink-0 flex-col gap-2 rounded-2xl border p-4 transition-all min-w-[160px]",
              addedId === stock.yahoo_symbol
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                : "border-white/10 bg-white/[0.03] hover:border-accent/40 hover:bg-accent/5 lg:min-w-[180px]"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="font-heading text-xs font-black tracking-wider text-white uppercase group-hover:text-accent transition-colors">
                {stock.symbol}
              </div>
              <div className={clsx(
                "rounded-lg p-1.5",
                addedId === stock.yahoo_symbol ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-white/[0.05] text-slate-400 group-hover:bg-accent group-hover:text-black"
              )}>
                {addedId === stock.yahoo_symbol ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </div>
            </div>
            <div className="truncate text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {stock.company_name}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
