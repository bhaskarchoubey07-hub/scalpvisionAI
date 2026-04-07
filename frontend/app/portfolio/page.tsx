"use client";

import React, { useState, useEffect } from "react";
import { SectionHeader } from "@/components/section-header";
import { fetchPortfolios, type Portfolio, createPortfolio, addPortfolioHolding, type MarketQuote, fetchMarketOverview } from "@/lib/api";
import { Wallet, Plus, Loader2, IndianRupee, TrendingUp, TrendingDown, Trash2, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [pData, mData] = await Promise.all([
        fetchPortfolios(token),
        fetchMarketOverview()
      ]);
      setPortfolios(pData);
      setMarketQuotes([...mData.stocks, ...mData.crypto, ...mData.indianStocks, ...mData.forex]);
    } catch (err) {
      console.error("Load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setAdding(true);
    try {
      await createPortfolio(token, newPortfolioName);
      setNewPortfolioName("");
      setShowAddModal(false);
      await loadData();
    } finally {
      setAdding(false);
    }
  };

  const calculatePerformance = (holdings: Portfolio['holdings']) => {
    let totalInvested = 0;
    let currentValue = 0;

    holdings.forEach(h => {
      totalInvested += h.quantity * h.avg_buy_price;
      const quote = marketQuotes.find(q => q.symbol === h.symbol);
      if (quote) {
        currentValue += h.quantity * quote.price;
      } else {
        currentValue += h.quantity * h.avg_buy_price; // Fallback
      }
    });

    const pnl = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    return { totalInvested, currentValue, pnl, pnlPercent };
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="grid-shell py-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <SectionHeader 
          eyebrow="Trading Vault" 
          title="Portfolio Intelligence" 
          description="Consolidate your multi-asset holdings into a single institutional-grade dashboard." 
        />
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-black shadow-glow hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Portfolio
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {portfolios.length === 0 ? (
          <div className="glass rounded-[2rem] p-12 text-center space-y-4">
             <div className="h-16 w-16 mx-auto rounded-3xl bg-white/5 flex items-center justify-center">
                <PieChart className="h-8 w-8 text-slate-500" />
             </div>
             <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Your vault is empty</p>
             <button onClick={() => setShowAddModal(true)} className="text-accent text-sm font-black underline decoration-dashed underline-offset-4">Build your first portfolio</button>
          </div>
        ) : (
          portfolios.map((portfolio) => {
            const { totalInvested, currentValue, pnl, pnlPercent } = calculatePerformance(portfolio.holdings);
            return (
              <motion.div 
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-[2rem] overflow-hidden border-white/5"
              >
                <div className="border-b border-white/5 bg-white/[0.02] p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                       <h3 className="text-2xl font-heading font-black tracking-widest text-white uppercase">{portfolio.name}</h3>
                       <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          <Wallet className="h-3 w-3 text-accent" />
                          <span>{portfolio.holdings.length} Assets Registered</span>
                          <span>•</span>
                          <span>Created {new Date(portfolio.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                         <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Portfolio Balance</div>
                         <div className="text-2xl font-heading font-black text-white">₹ {currentValue.toLocaleString('en-IN')}</div>
                      </div>
                      <div className={clsx(
                        "rounded-2xl px-6 py-2 text-center min-w-[120px]",
                        pnl >= 0 ? "bg-accent/10 text-accent border border-accent/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                         <div className="text-[10px] font-bold uppercase tracking-widest leading-tight">Total P&L</div>
                         <div className="text-lg font-black">{pnl >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                   <div className="overflow-x-auto rounded-3xl border border-white/5">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white/5 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                          <tr>
                            <th className="px-6 py-4 text-left">Asset</th>
                            <th className="px-6 py-4 text-right">Quantity</th>
                            <th className="px-6 py-4 text-right">Avg Price</th>
                            <th className="px-6 py-4 text-right">Last Price</th>
                            <th className="px-6 py-4 text-right">P&L</th>
                            <th className="px-6 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                          {portfolio.holdings.map((h) => {
                            const quote = marketQuotes.find(q => q.symbol === h.symbol);
                            const pnlVal = quote ? (quote.price - h.avg_buy_price) * h.quantity : 0;
                            const pnlPct = (pnlVal / (h.quantity * h.avg_buy_price)) * 100;
                            return (
                              <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-5">
                                  <div className="flex flex-col">
                                    <span className="text-white font-bold tracking-widest font-heading uppercase">{h.symbol.replace('.NS', '')}</span>
                                    <span className="text-[10px] text-slate-500 uppercase font-black">{h.market === 'indian-stock' ? 'NSE:EQ' : h.market}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right text-slate-300">{h.quantity}</td>
                                <td className="px-6 py-5 text-right text-slate-300">₹ {h.avg_buy_price.toLocaleString('en-IN')}</td>
                                <td className="px-6 py-5 text-right text-white">₹ {quote?.price?.toLocaleString('en-IN') ?? '--'}</td>
                                <td className={clsx(
                                  "px-6 py-5 text-right font-bold",
                                  pnlVal >= 0 ? "text-accent" : "text-red-400"
                                )}>
                                  {pnlPct.toFixed(2)}%
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <button className="text-slate-600 hover:text-red-400 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Add manual inline entry if needed */}
                        </tbody>
                      </table>
                   </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-md glass rounded-[2rem] p-8 border-accent/20"
             >
                <h3 className="text-xl font-heading font-black tracking-widest text-white uppercase mb-6">Deploy New Portfolio</h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vault Name</label>
                      <input 
                        type="text" 
                        value={newPortfolioName}
                        onChange={(e) => setNewPortfolioName(e.target.value)}
                        placeholder="e.g. Long-term Wealth"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 px-5 text-sm text-white focus:border-accent/40 focus:outline-none"
                      />
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCreatePortfolio}
                        disabled={adding || !newPortfolioName}
                        className="flex-1 rounded-2xl bg-accent py-4 text-sm font-black uppercase tracking-widest text-black shadow-glow disabled:opacity-50"
                      >
                        {adding ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-black" /> : "Initiate"}
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
