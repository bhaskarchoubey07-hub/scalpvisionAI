"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ShieldCheck, Terminal, Cpu, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { SignalService } from "@/pro/services/signalService";
import { SignalData } from "@/pro/engines/signalEngine";
import { BrokerRedirect } from "@/pro/integrations/brokerRedirect";
import ExecuteTradeButton from "@/components/pro/Trading/ExecuteTradeButton";
import TradingDisclaimer from "@/components/pro/Trading/TradingDisclaimer";

export default function TerminalPage() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const loadSignals = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await SignalService.getSignals();
      setSignals(data);
      setError(null);
    } catch (err) {
      console.error("Terminal load error:", err);
      if (signals.length === 0) setError("Engine connection failed. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [signals.length]);

  const handleExecute = (signal: SignalData) => {
    BrokerRedirect.redirectToBroker(signal);
  };

  useEffect(() => {
    loadSignals(true);

    refreshInterval.current = setInterval(() => {
      loadSignals(false);
    }, 15000); // 15 seconds refresh

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [loadSignals]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Execution Mode</div>
            <Terminal className="h-3 w-3 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
             Trading Terminal
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
             Institutional execution interface for AI-validated signals.
          </p>
        </div>
        
        <button 
          onClick={() => loadSignals(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          REFRESH ENGINE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {loading ? (
           <div className="flex flex-col items-center justify-center p-32 gap-6 glass rounded-[3rem] border border-white/5 bg-panel/10">
              <div className="h-16 w-16 rounded-full border-t-2 border-emerald-500 animate-spin" />
              <div className="text-center">
                 <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Initializing Execution Link</h3>
                 <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Synchronizing Market Data...</p>
              </div>
           </div>
         ) : error ? (
           <div className="flex flex-col items-center justify-center p-20 gap-4 glass rounded-[3rem] border border-red-500/10 bg-red-500/5">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <div className="text-center text-red-400 font-bold">{error}</div>
              <button onClick={() => loadSignals(true)} className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold transition-all">RETRY CONNECTION</button>
           </div>
         ) : signals.length === 0 ? (
           <div className="p-32 text-center text-slate-500 glass rounded-[3rem] border border-white/5 bg-panel/10">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
              No signals available
           </div>
         ) : (
           <div className="space-y-4">
              <AnimatePresence>
                {signals.map((sig, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-3xl border border-white/5 bg-panel/10 p-6 flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-white/[0.02] transition-colors group"
                  >
                     <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-sm">
                           {sig.asset_symbol.slice(0, 2)}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl font-black text-white uppercase tracking-tight">{sig.asset_symbol}</span>
                              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${sig.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                 {sig.direction === 'LONG' ? 'CALL' : 'PUT'}
                              </div>
                           </div>
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              {sig.direction === 'LONG' ? 'BULLISH' : 'BEARISH'} • AI-SCORE
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-8 flex-1 w-full md:w-auto border-x border-white/5 px-8">
                        <div>
                           <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Entry Zone</div>
                           <div className="text-sm font-bold text-white font-mono">{sig.entry_price}</div>
                        </div>
                        <div>
                           <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target</div>
                           <div className="text-sm font-bold text-emerald-400 font-mono">{sig.take_profit}</div>
                        </div>
                        <div>
                           <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Conviction</div>
                           <div className="text-sm font-bold text-white flex items-center gap-2">
                              {sig.confidence}%
                              <Cpu className="h-3 w-3 text-indigo-400" />
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                        <ExecuteTradeButton 
                           symbol={sig.asset_symbol} 
                           side={sig.direction === 'LONG' ? 'BUY' : 'SELL'}
                           quantity={1}
                        />
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
         )}
      </div>

      <TradingDisclaimer />
    </div>
  );
}
