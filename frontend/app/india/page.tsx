"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { CandlesChart } from "@/components/candles-chart";
import { 
  fetchCandles, 
  type Candle, 
  fetchMarketOverview, 
  type MarketQuote, 
  addWatchlistItem,
  fetchForecast,
  type ForecastResult,
  fetchPortfolios,
  type Portfolio,
  addPortfolioHolding
} from "@/lib/api";
import { IndianStockSearch } from "@/components/indian-stock-search";
import { ForecastChart } from "@/components/forecast-chart";
import { Loader2, Plus, CheckCircle2, TrendingUp, TrendingDown, ChartBarIcon, Sparkles, Wallet } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function IndiaMarketPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.NS");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  
  // Alpha Vision State
  const [isForecastMode, setIsForecastMode] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  
  // Portfolio State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<MarketQuote | null>(null);
  const [userPortfolios, setUserPortfolios] = useState<Portfolio[]>([]);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);

  const [marketData, setMarketData] = useState<MarketQuote[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const { items, add, isAuthenticated } = useWatchlist();
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarket() {
      try {
        const data = await fetchMarketOverview();
        setMarketData(data.indianStocks);
      } catch (err) {
        console.error("Failed to load market data", err);
      } finally {
        setLoadingMarket(false);
      }
    }
    loadMarket();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadChart() {
      try {
        setLoadingChart(true);
        const data = await fetchCandles(selectedSymbol, "3mo", "1d");
        if (active) setCandles(data);
      } catch (err) {
        console.error("Chart load error", err);
      } finally {
        if (active) setLoadingChart(false);
      }
    }
    loadChart();
    return () => { active = false; };
  }, [selectedSymbol]);

  useEffect(() => {
    async function loadForecast() {
      if (!isForecastMode) return;
      try {
        setLoadingForecast(true);
        const data = await fetchForecast(selectedSymbol, "indian-stock");
        setForecastData(data);
      } catch (err) {
        console.error("Forecast error", err);
      } finally {
        setLoadingForecast(false);
      }
    }
    loadForecast();
  }, [selectedSymbol, isForecastMode]);

  useEffect(() => {
    async function loadUserPortfolios() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const data = await fetchPortfolios(token);
        setUserPortfolios(data);
      } catch (err) {
        console.error("User portfolios error", err);
      }
    }
    loadUserPortfolios();
  }, [showPortfolioModal]);

  const handleAddToPortfolio = async (portfolioId: string) => {
    if (!selectedHolding) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setAddingToPortfolio(true);
    try {
      await addPortfolioHolding(token, portfolioId, {
        symbol: selectedHolding.symbol,
        market: "indian-stock",
        quantity: 1, // Default
        avg_buy_price: selectedHolding.price
      });
      setShowPortfolioModal(false);
    } catch (err) {
      console.error("Add to portfolio error", err);
    } finally {
      setAddingToPortfolio(false);
    }
  };

  const handleToggleWatchlist = async (quote: MarketQuote) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setAddingId(quote.symbol);
    try {
      await addWatchlistItem(token, quote.symbol, "indian-stock");
    } catch (err) {
      console.error("Watchlist error", err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="grid-shell py-8 space-y-12">
      <SectionHeader
        eyebrow="Indian Market Terminal"
        title="Institutional-grade NSE Intelligence"
        description="Monitor NIFTY 50 price action, analyze technical setups, and manage your watchlist from a single professional interface."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          {/* Main Chart Section */}
          <div className="glass rounded-[2rem] p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent text-black flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-black tracking-widest text-white uppercase">{selectedSymbol.replace('.NS', '')}</h2>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     <span className="text-accent">NSE Equity</span>
                     <span>•</span>
                     <span>{isForecastMode ? "5-Year Alpha Vision Forecast" : "3-Month Daily Trend"}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => setIsForecastMode(!isForecastMode)}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                    isForecastMode 
                      ? "bg-accent text-black shadow-glow" 
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
                  )}
                >
                  <Sparkles className={clsx("h-3 w-3", isForecastMode ? "animate-pulse" : "text-slate-500")} />
                  {isForecastMode ? "Alpha Vision On" : "Unlock 5Y Forecast"}
                </button>
                <div className="w-full md:w-[280px]">
                  <IndianStockSearch onAdded={() => { /* Refresh logic if needed */ }} />
                </div>
              </div>
            </div>

            <div className="min-h-[460px] flex flex-col bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden">
               {isForecastMode ? (
                 <div className="flex-1 flex flex-col p-8 space-y-8">
                   {loadingForecast ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 animate-pulse">Running Neural Projections...</p>
                      </div>
                   ) : forecastData ? (
                      <>
                        <div className="flex-1 min-h-[300px]">
                           <ForecastChart points={forecastData.points} trend={forecastData.trend} candles={candles} />
                        </div>
                        <div className="glass rounded-2xl p-6 border-accent/20 bg-accent/5">
                           <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="h-4 w-4 text-accent" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Alpha Insight (95% CI)</span>
                           </div>
                           <p className="text-sm text-slate-300 leading-relaxed font-medium">
                              {forecastData.narrative}
                           </p>
                        </div>
                      </>
                   ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-500 uppercase tracking-widest">
                        Select a company to initiate 5-year Alpha Vision
                      </div>
                   )}
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col">
                   <div className="flex-1 flex items-center justify-center overflow-hidden">
                      {loadingChart ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="h-8 w-8 animate-spin text-accent" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Syncing live exchange...</p>
                        </div>
                      ) : (
                        <CandlesChart candles={candles} />
                      )}
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Market Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <TrendingUp className="h-4 w-4 text-accent" />
               <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">NIFTY 50 Overview</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketData.map((quote) => {
                const inWatchlist = items.some(i => i.symbol === quote.symbol);
                return (
                  <div 
                    key={quote.symbol}
                    className={clsx(
                      "glass rounded-3xl p-5 cursor-pointer transition-all hover:border-accent/30 group",
                      selectedSymbol === quote.symbol && "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
                    )}
                    onClick={() => setSelectedSymbol(quote.symbol)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="text-lg font-heading font-black tracking-wider text-white group-hover:text-accent transition-colors">
                          {quote.symbol.replace('.NS', '')}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">NSE:EQ</div>
                      </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHolding(quote);
                          setShowPortfolioModal(true);
                        }}
                        className="h-8 w-8 rounded-xl flex items-center justify-center transition-all bg-white/5 text-slate-400 hover:bg-accent hover:text-black border border-white/5"
                      >
                        <Wallet className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!inWatchlist) handleToggleWatchlist(quote);
                        }}
                        className={clsx(
                          "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                          inWatchlist 
                            ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                            : "bg-white/5 text-slate-400 hover:bg-accent hover:text-black"
                        )}
                      >
                        {addingId === quote.symbol ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : inWatchlist ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] font-bold text-slate-500">₹</span>
                        <span className="text-xl font-heading font-black text-white">{quote.price.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={clsx(
                        "text-[10px] font-bold flex items-center gap-1",
                        quote.changePercent >= 0 ? "text-accent" : "text-red-400"
                      )}>
                        {quote.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(quote.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Statistics */}
        <div className="space-y-8">
           <div className="glass rounded-[2rem] p-8 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Market Sentiment</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-accent">Advances</span>
                    <span className="text-red-400">Declines</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-red-400/20 overflow-hidden flex">
                    <div className="h-full bg-accent" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vol Leader</div>
                    <div className="text-sm font-heading font-black text-white">RELIANCE</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Session Max</div>
                    <div className="text-sm font-heading font-black text-accent">+4.2%</div>
                  </div>
                </div>
              </div>
           </div>

           <div className="glass rounded-[2rem] p-8 border-accent/10 bg-accent/5">
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-accent font-bold">Pro Tip:</span> NIFTY 50 stocks generally exhibit higher liquidity between 9:15 AM and 3:30 PM IST. Scalp Vision uses direct NSE feeds for the most accurate trade signals during these hours.
              </p>
           </div>
        </div>
      </div>

      {/* Portfolio Selection Modal */}
      <AnimatePresence>
        {showPortfolioModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-md glass rounded-[2rem] p-8 border-accent/20"
             >
                <h3 className="text-xl font-heading font-black tracking-widest text-white uppercase mb-6">Select Vault</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Adding {selectedHolding?.symbol.replace('.NS', '')} to portfolio</p>
                
                <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                   {userPortfolios.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No vaults found. Create one in the Portfolio page.</p>
                   ) : (
                      userPortfolios.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleAddToPortfolio(p.id)}
                          disabled={addingToPortfolio}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/40 group transition-all"
                        >
                           <span className="text-sm font-bold text-white group-hover:text-accent font-heading tracking-widest">{p.name}</span>
                           {addingToPortfolio ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <Plus className="h-4 w-4 text-slate-500" />}
                        </button>
                      ))
                   )}
                </div>

                <button 
                  onClick={() => setShowPortfolioModal(false)}
                  className="w-full rounded-2xl bg-white/5 py-4 text-sm font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10"
                >
                  Close
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
