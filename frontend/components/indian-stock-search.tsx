"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, Loader2, IndianRupee, Building2, CheckCircle2 } from "lucide-react";
import { fetchIndianStocksSearch, type IndianStock, addWatchlistItem } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface Props {
  onAdded?: () => void;
}

export function IndianStockSearch({ onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IndianStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const data = await fetchIndianStocksSearch(query);
          setResults(data);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

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

  return (
    <div className="relative w-full max-w-2xl" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          ) : (
            <Search className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Indian stocks (e.g. Reliance, TCS, HDFC)..."
          className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
        />
      </div>

      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 z-[100] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
              {results.map((stock) => (
                <div
                  key={stock.yahoo_symbol}
                  className="group flex items-center justify-between rounded-xl p-3 transition-all hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-accent transition-colors">
                        {stock.company_name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span className="text-accent">{stock.symbol}</span>
                        <span>•</span>
                        <span>{stock.exchange}</span>
                        <span>•</span>
                        <span>{stock.sector}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(stock)}
                    disabled={addingId === stock.yahoo_symbol || addedId === stock.yahoo_symbol}
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95",
                      addedId === stock.yahoo_symbol 
                        ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                        : "bg-white/[0.05] text-slate-400 hover:bg-accent hover:text-black hover:shadow-glow"
                    )}
                  >
                    {addingId === stock.yahoo_symbol ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : addedId === stock.yahoo_symbol ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 bg-white/[0.02] p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Found {results.length} companies matched query
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
