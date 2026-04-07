"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, type Time, type ISeriesApi } from "lightweight-charts";
import { type ForecastPoint, type Candle } from "@/lib/api";

interface Props {
  points: ForecastPoint[];
  trend: "bullish" | "bearish" | "neutral";
  candles?: Candle[];
}

export function ForecastChart({ points, trend, candles }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      timeScale: {
        timeVisible: false,
        borderColor: "rgba(255,255,255,0.08)",
        rightOffset: 5,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      crosshair: {
        vertLine: { color: "rgba(6,182,212,0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(6,182,212,0.3)", width: 1, style: 2 },
      },
    });

    const historicalPts = points.filter((p) => !p.is_forecast);
    const forecastPts = points.filter((p) => p.is_forecast);

    // ── Candlestick series for historical data ──
    if (candles && candles.length > 0) {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#3dd9b8",
        borderUpColor: "#3dd9b8",
        wickUpColor: "#3dd9b8",
        downColor: "#ff8c5a",
        borderDownColor: "#ff8c5a",
        wickDownColor: "#ff8c5a",
      });
      candleSeries.setData(
        candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
    } else if (historicalPts.length > 0) {
      // Fallback: simulate candles from forecast point data
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#3dd9b8",
        borderUpColor: "#3dd9b8",
        wickUpColor: "#3dd9b8",
        downColor: "#ff8c5a",
        borderDownColor: "#ff8c5a",
        wickDownColor: "#ff8c5a",
      });
      candleSeries.setData(
        historicalPts.map((p, i) => {
          const prev = i > 0 ? historicalPts[i - 1].price : p.price;
          const variance = p.price * 0.015;
          const open = prev;
          const close = p.price;
          const high = Math.max(open, close) + Math.random() * variance;
          const low = Math.min(open, close) - Math.random() * variance;
          return {
            time: p.date as Time,
            open,
            high,
            low,
            close,
          };
        })
      );
    }

    // ── Forecast line series (dashed) ──
    if (forecastPts.length > 0) {
      const forecastColor = trend === "bearish" ? "#ff8c5a" : "#3dd9b8";

      const forecastLine = chart.addLineSeries({
        color: forecastColor,
        lineWidth: 2,
        lineStyle: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceLineVisible: true,
        priceLineColor: forecastColor,
        priceLineStyle: 2,
        lastValueVisible: true,
      });

      // Bridge: include last historical point so lines connect
      const bridge =
        historicalPts.length > 0
          ? [{ time: historicalPts[historicalPts.length - 1].date as Time, value: historicalPts[historicalPts.length - 1].price }]
          : [];

      forecastLine.setData([
        ...bridge,
        ...forecastPts.map((p) => ({
          time: p.date as Time,
          value: p.price,
        })),
      ]);
    }

    // ── Current price marker ──
    if (historicalPts.length > 0) {
      const lastPrice = historicalPts[historicalPts.length - 1].price;
      const markerLine = chart.addLineSeries({
        color: "transparent",
        lineWidth: 1,
        priceLineVisible: true,
        priceLineColor: "rgba(6,182,212,0.6)",
        priceLineStyle: 1,
        lastValueVisible: true,
      });
      markerLine.setData([
        { time: historicalPts[historicalPts.length - 1].date as Time, value: lastPrice },
      ]);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [points, candles, trend]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#3dd9b8]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Historical
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-0.5 w-5"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${trend === "bearish" ? "#ff8c5a" : "#3dd9b8"} 0, ${trend === "bearish" ? "#ff8c5a" : "#3dd9b8"} 4px, transparent 4px, transparent 8px)`,
            }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            5Y Projection
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-2xl border border-white/5 bg-black/30"
      />
    </div>
  );
}
