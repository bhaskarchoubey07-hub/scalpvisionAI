"use client";

import React, { useMemo } from "react";
import { type ForecastPoint } from "@/lib/api";
import { motion } from "framer-motion";
import clsx from "clsx";

interface Props {
  points: ForecastPoint[];
  trend: "bullish" | "bearish" | "neutral";
}

export function ForecastChart({ points, trend }: Props) {
  const chartHeight = 300;
  const chartWidth = 800;
  const padding = 40;

  const { minPrice, maxPrice, historicalPoints, forecastPoints } = useMemo(() => {
    const prices = points.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    
    // Normalize to chart coordinates
    const scaleY = (p: number) => chartHeight - padding - ((p - min) / (range || 1)) * (chartHeight - padding * 2);
    const scaleX = (idx: number) => padding + (idx / (points.length - 1)) * (chartWidth - padding * 2);

    const coords = points.map((p, i) => ({
      x: scaleX(i),
      y: scaleY(p.price),
      isForecast: p.is_forecast
    }));

    return {
      minPrice: min,
      maxPrice: max,
      historicalPoints: coords.filter(p => !p.isForecast),
      forecastPoints: coords.filter(p => p.isForecast)
    };
  }, [points]);

  const historicalPath = historicalPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Forecast path starts from the last historical point
  const lastHistory = historicalPoints[historicalPoints.length - 1];
  const forecastPath = lastHistory 
    ? `M ${lastHistory.x} ${lastHistory.y} ` + forecastPoints.map(p => `L ${p.x} ${p.y}`).join(' ')
    : "";

  return (
    <div className="relative w-full overflow-hidden bg-black/40 rounded-3xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Historical Basis</span>
            <div className="h-2 w-2 rounded-full bg-accent/40 ml-4 border border-dashed border-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">5-Year Prediction</span>
         </div>
         <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Min: {minPrice.toFixed(2)} • Max: {maxPrice.toFixed(2)}
         </div>
      </div>

      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Grids */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.05)" />

        {/* Forecast Glow Area */}
        {lastHistory && forecastPoints.length > 0 && (
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            d={`${forecastPath} L ${forecastPoints[forecastPoints.length-1].x} ${chartHeight - padding} L ${lastHistory.x} ${chartHeight - padding} Z`}
            fill={trend === "bullish" ? "url(#glow-bull)" : "url(#glow-bear)"}
            className="opacity-20"
          />
        )}

        {/* Historical Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={historicalPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
        />

        {/* Forecast Line */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1.5, ease: "linear" }}
          d={forecastPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Definitions */}
        <defs>
          <linearGradient id="glow-bull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="glow-bear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
