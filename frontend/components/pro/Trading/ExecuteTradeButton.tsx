"use client";

import React, { useState } from "react";
import { Rocket, ChevronDown, ExternalLink } from "lucide-react";

interface ExecuteTradeButtonProps {
  symbol: string;
  side: "BUY" | "SELL";
  quantity?: number;
}

export default function ExecuteTradeButton({ symbol, side, quantity = 1 }: ExecuteTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize symbol for Indian markets if needed (e.g. RELIANCE -> RELIANCE)
  const cleanSymbol = symbol.split(":")[1] || symbol;

  const handleExecute = (broker: "zerodha" | "upstox") => {
    // Zerodha Kite: Remove exchange prefix or suffix (e.g. NSE:RELIANCE or RELIANCE.NS -> RELIANCE)
    const zerodhaSymbol = symbol.split(":")[1] || symbol.split(".")[0] || symbol;
    
    let url = "";
    if (broker === "zerodha") {
      url = `https://kite.zerodha.com/?symbol=${zerodhaSymbol}&transaction_type=${side}`;
    } else {
      url = `https://upstox.com/trading/buy?symbol=${zerodhaSymbol}&side=${side.toLowerCase()}&quantity=${quantity}`;
    }
    
    window.open(url, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center">
        <button
          onClick={() => handleExecute("zerodha")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-l-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${
            side === "BUY" ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
          }`}
        >
          <Rocket className="h-4 w-4" />
          🚀 Execute Trade
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-2.5 rounded-r-xl border-l border-white/10 transition-colors ${
            side === "BUY" ? "bg-emerald-600 hover:bg-emerald-550" : "bg-red-600 hover:bg-red-550"
          }`}
        >
          <ChevronDown className={`h-4 w-4 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-[100] overflow-hidden backdrop-blur-xl">
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleExecute("zerodha")}
              className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest"
            >
              Zerodha (Kite)
              <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleExecute("upstox")}
              className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest"
            >
              Upstox
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
