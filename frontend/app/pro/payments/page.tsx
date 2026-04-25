"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, AlertCircle, RefreshCcw, ExternalLink, ShieldCheck } from "lucide-react";

export default function PaymentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header with Padding - Kept for aesthetics but reduced to integrate well with fullscreen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#030712] border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-indigo-400" />
            Smart Payments & Wallet
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-emerald-500/70" />
            SECURE GATEWAY • SCALPVISION AI ECOSYSTEM
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
              const iframe = document.getElementById('payment-iframe') as HTMLIFrameElement;
              if (iframe) iframe.src = iframe.src;
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <a 
            href="https://payment-app-nine-pearl.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-glow"
          >
            External View <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Iframe Section - Truly Fullscreen */}
      <div className="relative flex-1 w-full bg-[#030712] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030712] z-10">
            <div className="relative">
              <div className="h-14 w-14 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <CreditCard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
            </div>
            <p className="mt-4 text-slate-500 text-xs font-medium tracking-widest uppercase animate-pulse">Initializing Terminal...</p>
          </div>
        )}

        {/* Fallback Handling */}
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030712] text-center p-8 z-20">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment service unavailable</h2>
            <p className="text-slate-400 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
              We're unable to establish a secure connection to the payment provider. Please verify your connection and try again.
            </p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
              }}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <iframe
            id="payment-iframe"
            src="https://payment-app-nine-pearl.vercel.app/"
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            title="ScalpVision Payment App"
            allow="payment; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
