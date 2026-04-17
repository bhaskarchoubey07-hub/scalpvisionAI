"use client";

import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewChart({ symbol = "NSE:RELIANCE" }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "5",
          timezone: "Asia/Kolkata",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0f172a",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          studies: [
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies",
            "Volume@tv-basicstudies"
          ],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Clean up script if needed, though TV widget usually manages itself
    };
  }, [symbol]);

  return (
    <div className="w-full h-full min-h-[600px] glass rounded-[2rem] border border-white/5 overflow-hidden bg-slate-950/50">
      <div 
        id="tradingview_chart_container" 
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}
