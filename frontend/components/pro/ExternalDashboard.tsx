"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, AlertCircle, Loader2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function ExternalDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const DASHBOARD_URL = "https://fino4-all.vercel.app/dashboard";

  useEffect(() => {
    // Timeout for loading state in case iframe takes too long
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full">
      {/* Header section matching pro theme */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-cyan-400" />
            Advanced Market Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time external intelligence engine integrated via secure tunnel.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Isolated Module</span>
          </div>
          <a
            href={DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            Open Full Screen
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 w-full rounded-2xl border border-white/5 bg-[#030712] overflow-hidden shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#030712]/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Initializing Secure Connection...</p>
            <p className="text-slate-500 text-xs mt-2 italic">Loading external market intelligence assets</p>
          </div>
        )}

        {hasError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-500/5">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Security Block Detected</h3>
            <p className="text-slate-400 max-w-md mb-8">
              The external dashboard is protected by security headers (X-Frame-Options) that prevent embedding for your security.
            </p>
            <a
              href={DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              Launch Dashboard in New Tab
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <iframe
            src={DASHBOARD_URL}
            className="w-full h-full border-none"
            onLoad={handleLoad}
            onError={() => setHasError(true)}
            title="External Intelligence Dashboard"
            sandbox="allow-scripts allow-same-origin allow-forms"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}
