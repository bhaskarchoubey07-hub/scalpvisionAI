"use client";

import { useState } from "react";
import { ExternalLink, CreditCard } from "lucide-react";

export function PaymentSection() {
  const [loading, setLoading] = useState(true);
  const paymentUrl = "https://payment-app-nine-pearl.vercel.app/";

  return (
    <section className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Smart Payments & Wallet
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Secure Financial Module</p>
          </div>
        </div>
        
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
        >
          Open Full Screen
          <ExternalLink className="h-3.5 w-3.5 text-accent" />
        </a>
      </div>

      <div className="relative w-full rounded-[2rem] overflow-hidden border border-white/5 bg-panel/20 glass shadow-2xl transition-all duration-500 hover:border-white/10">
        {/* Responsive heights: 500px mobile, 600px md, 700px lg */}
        <div className="h-[500px] md:h-[600px] lg:h-[700px] w-full relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-sm z-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent mb-4" />
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase animate-pulse">Initializing Payment Gateway...</p>
            </div>
          )}
          
          <iframe
            src={paymentUrl}
            width="100%"
            height="100%"
            className="w-full h-full border-none"
            loading="lazy"
            title="Smart Payments & Wallet"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          
          {/* Fallback text if iframe is blocked or fails (though difficult to detect network failure) */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center text-slate-500 text-sm italic p-8 text-center">
            Payment service unavailable. Please try again later.
          </div>
        </div>
      </div>
    </section>
  );
}
