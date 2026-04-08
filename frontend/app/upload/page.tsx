"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/section-header";
import { UploadDropzone } from "@/components/upload-dropzone";
import { uploadChart, analyzeChart, analyzeTicker, fetchIndianStocksSearch, type AnalysisResult, type IndianStock } from "@/lib/api";
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck, Zap, Search, TrendingUp, BarChart3 } from "lucide-react";
import clsx from "clsx";

type Step = {
  label: string;
  status: "pending" | "loading" | "done" | "error";
};

type AnalysisMode = "ticker" | "image";

const TICKER_STEPS: Step[] = [
  { label: "Security validation & rate protection", status: "pending" },
  { label: "Fetching real-time market data (Yahoo Finance)", status: "pending" },
  { label: "Multi-indicator technical analysis (9 indicators)", status: "pending" },
  { label: "Multi-timeframe confluence (1h / 4h / 1d)", status: "pending" },
  { label: "ATR-based signal generation", status: "pending" },
];

const IMAGE_STEPS: Step[] = [
  { label: "Security validation & rate protection", status: "pending" },
  { label: "Optimized cloud storage upload", status: "pending" },
  { label: "Computer Vision pattern detection", status: "pending" },
  { label: "AI neural engine signal generation", status: "pending" },
];

const MARKET_OPTIONS = [
  { value: "indian-stock", label: "NSE/BSE" },
  { value: "stock", label: "US Stocks" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
] as const;

const QUICK_TICKERS = [
  { symbol: "RELIANCE.NS", label: "Reliance", market: "indian-stock" as const },
  { symbol: "TCS.NS", label: "TCS", market: "indian-stock" as const },
  { symbol: "HDFCBANK.NS", label: "HDFC Bank", market: "indian-stock" as const },
  { symbol: "INFY.NS", label: "Infosys", market: "indian-stock" as const },
  { symbol: "SBIN.NS", label: "SBI", market: "indian-stock" as const },
  { symbol: "AAPL", label: "Apple", market: "stock" as const },
];

export default function UploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AnalysisMode>("ticker");
  const [steps, setSteps] = useState<Step[]>(TICKER_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [ticker, setTicker] = useState("");
  const [market, setMarket] = useState<"stock" | "crypto" | "indian-stock" | "forex">("indian-stock");
  const [searchResults, setSearchResults] = useState<IndianStock[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const setStep = (index: number, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  };

  // Search Indian stocks as user types
  useEffect(() => {
    if (ticker.length < 2 || market !== "indian-stock") {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await fetchIndianStocksSearch(ticker);
        setSearchResults(results);
        setShowSearch(true);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [ticker, market]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTickerAnalysis = useCallback(async (sym?: string, mkt?: typeof market) => {
    const analysisSymbol = sym || ticker;
    const analysisMarket = mkt || market;
    
    if (!analysisSymbol.trim()) return;
    if (isRunning) return;
    
    setIsRunning(true);
    setError(null);
    setSteps(TICKER_STEPS);
    setShowSearch(false);

    try {
      // Step 1: Validation
      setStep(0, "loading");
      await new Promise((r) => setTimeout(r, 400));
      setStep(0, "done");

      // Step 2: Fetching data
      setStep(1, "loading");

      // Step 3-5 happen inside analyzeTicker
      const result: AnalysisResult = await analyzeTicker(analysisSymbol, analysisMarket);
      setStep(1, "done");

      setStep(2, "loading");
      await new Promise((r) => setTimeout(r, 600));
      setStep(2, "done");

      setStep(3, "loading");
      await new Promise((r) => setTimeout(r, 500));
      setStep(3, "done");

      setStep(4, "loading");
      await new Promise((r) => setTimeout(r, 300));
      setStep(4, "done");

      sessionStorage.setItem("latestSignal", JSON.stringify(result));
      await new Promise((r) => setTimeout(r, 400));
      router.push("/signals/result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      setSteps((prev) => prev.map((s) => (s.status === "loading" ? { ...s, status: "error" } : s)));
    } finally {
      setIsRunning(false);
    }
  }, [ticker, market, isRunning, router]);

  const handleImageAnalysis = async (file: File) => {
    if (isRunning) return;
    
    if (!ticker.trim()) {
      setError("Please enter a ticker symbol first, then upload a chart image.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setSteps(IMAGE_STEPS);

    try {
      setStep(0, "loading");
      if (!file.type.startsWith("image/")) throw new Error("Only image files are supported.");
      if (file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8 MB.");
      await new Promise((r) => setTimeout(r, 600));
      setStep(0, "done");

      setStep(1, "loading");
      const { imageUrl } = await uploadChart(file);
      setStep(1, "done");

      setStep(2, "loading");
      await new Promise((r) => setTimeout(r, 800));
      setStep(2, "done");

      setStep(3, "loading");
      const result: AnalysisResult = await analyzeChart(imageUrl, market, ticker);
      setStep(3, "done");

      sessionStorage.setItem("latestSignal", JSON.stringify({ ...result, imageUrl }));
      await new Promise((r) => setTimeout(r, 400));
      router.push("/signals/result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      setSteps((prev) => prev.map((s) => (s.status === "loading" ? { ...s, status: "error" } : s)));
    } finally {
      setIsRunning(false);
    }
  };

  const allDone = steps.every((s) => s.status === "done");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid-shell py-8"
    >
      <SectionHeader
        eyebrow="Intelligence Intake"
        title="Real-time market analysis"
        description="Enter a ticker symbol for instant multi-indicator analysis using live market data, or upload a chart screenshot for visual pattern detection."
      />

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] mt-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-1.5">
            <button
              onClick={() => { setMode("ticker"); setSteps(TICKER_STEPS); setError(null); }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all",
                mode === "ticker"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "text-slate-500 hover:text-white"
              )}
            >
              <BarChart3 className="h-4 w-4" /> Ticker Analysis
            </button>
            <button
              onClick={() => { setMode("image"); setSteps(IMAGE_STEPS); setError(null); }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all",
                mode === "image"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "text-slate-500 hover:text-white"
              )}
            >
              <Search className="h-4 w-4" /> Chart Upload
            </button>
          </div>

          {/* Ticker Input Section — Always visible */}
          <div className="glass rounded-[2rem] p-6 space-y-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              Enter Ticker Symbol
            </div>

            {/* Market Selector */}
            <div className="flex gap-2 flex-wrap">
              {MARKET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMarket(opt.value as typeof market)}
                  disabled={isRunning}
                  className={clsx(
                    "rounded-xl px-4 py-2 text-xs font-bold transition-all border",
                    market === opt.value
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:border-white/20 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Ticker Input */}
            <div className="relative" ref={searchRef}>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTickerAnalysis();
                    }}
                    placeholder={
                      market === "indian-stock" ? "RELIANCE.NS, TCS.NS, INFY.NS..." :
                      market === "crypto" ? "BTCUSDT, ETHUSDT, SOLUSDT..." :
                      market === "forex" ? "EURUSD=X, USDINR=X..." :
                      "AAPL, NVDA, TSLA, MSFT..."
                    }
                    disabled={isRunning}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-accent/50 focus:ring-1 focus:ring-accent/20 disabled:opacity-50"
                  />
                </div>
                {mode === "ticker" && (
                  <button
                    onClick={() => handleTickerAnalysis()}
                    disabled={isRunning || !ticker.trim()}
                    className={clsx(
                      "rounded-xl px-6 py-3.5 text-sm font-black tracking-widest transition-all",
                      isRunning || !ticker.trim()
                        ? "bg-white/5 text-slate-600 cursor-not-allowed"
                        : "bg-accent text-black shadow-glow hover:scale-[1.02] hover:brightness-110 active:scale-95"
                    )}
                  >
                    {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : "ANALYZE"}
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearch && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden"
                  >
                    {searchResults.slice(0, 6).map((stock) => (
                      <button
                        key={stock.yahoo_symbol}
                        onClick={() => {
                          setTicker(stock.yahoo_symbol);
                          setShowSearch(false);
                          if (mode === "ticker") {
                            handleTickerAnalysis(stock.yahoo_symbol, "indian-stock");
                          }
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-all hover:bg-white/5 border-b border-white/[0.04] last:border-b-0"
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{stock.yahoo_symbol}</div>
                          <div className="text-xs text-slate-400">{stock.company_name}</div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">{stock.exchange}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Pick Buttons */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 self-center mr-1">Quick:</span>
              {QUICK_TICKERS.map((qt) => (
                <button
                  key={qt.symbol}
                  onClick={() => {
                    setTicker(qt.symbol);
                    setMarket(qt.market);
                    if (mode === "ticker") handleTickerAnalysis(qt.symbol, qt.market);
                  }}
                  disabled={isRunning}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[10px] font-bold text-slate-400 transition-all hover:border-accent/30 hover:text-accent disabled:opacity-40"
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload (shown in image mode) */}
          {mode === "image" && (
            <div>
              <UploadDropzone onSelect={handleImageAnalysis} disabled={isRunning} />
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-slate-500">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secure Processing
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5 text-accent" /> Real-time Analysis
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-white">Pipeline Consensus</h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {steps.map((step, i) => (
                <motion.div
                  key={`${mode}-${i}`}
                  layout
                  className={clsx(
                    "flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500",
                    step.status === "done" ? "border-accent/30 bg-accent/[0.03] text-accent" :
                    step.status === "loading" ? "border-white/20 bg-white/[0.05]" :
                    step.status === "error" ? "border-red-500/30 bg-red-500/[0.03] text-red-400" :
                    "border-white/[0.05] bg-white/[0.01]"
                  )}
                >
                  {step.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> :
                   step.status === "done" ? <CheckCircle2 className="h-4 w-4 text-accent" /> :
                   step.status === "error" ? <AlertCircle className="h-4 w-4 text-red-400" /> :
                   <div className="h-4 w-4 rounded-full border border-white/20" />}
                  <span className="text-xs font-medium tracking-tight">{step.label}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className={clsx(
            "mt-8 rounded-2xl p-5 text-center text-xs font-bold tracking-widest transition-all duration-500",
            error ? "bg-red-500/10 text-red-400 border border-red-500/20" :
            allDone ? "bg-accent/10 text-accent border border-accent/20" :
            isRunning ? "bg-white/5 text-slate-400 border border-white/10" :
            "bg-white/[0.02] text-slate-500 border border-white/[0.05]"
          )}>
            {error ? `SYSTEM ERROR : ${error.toUpperCase()}` :
             allDone ? "PIPELINE COMPLETE • REDIRECTING..." :
             isRunning ? "NEURAL ENGINE DEPLOYED..." :
             "AWAITING INPUT SOURCE"}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
