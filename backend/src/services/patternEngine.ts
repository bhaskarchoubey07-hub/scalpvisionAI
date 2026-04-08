/**
 * patternEngine.ts
 * 
 * Specialized detection for advanced price action patterns.
 * Patterns like Divergences often lead to high-probability trend reversals.
 */

import { type Candle } from "./technicalAnalysis.js";
import { RSI, BollingerBands } from "technicalindicators";

export type PatternSignal = {
  name: string;
  type: "bullish" | "bearish";
  strength: number; // 0-100
  description: string;
};

/**
 * Detects RSI Divergence.
 * Bullish Divergence: Price Lower Low, RSI Higher Low
 * Bearish Divergence: Price Higher High, RSI Lower High
 */
export function detectDivergences(candles: Candle[]): PatternSignal[] {
  const signals: PatternSignal[] = [];
  const closes = candles.map(c => c.close);
  const rsiValues = RSI.calculate({ values: closes, period: 14 });
  
  if (candles.length < 50 || rsiValues.length < 30) return [];

  const checkCount = 20; // Look back 20 candles
  const recentRSI = rsiValues.slice(-checkCount);
  const recentCandles = candles.slice(-checkCount);

  // Simple trough/peak detection
  const findTroughs = (vals: number[]) => {
    const troughs: number[] = [];
    for (let i = 1; i < vals.length - 1; i++) {
      if (vals[i] < vals[i-1] && vals[i] < vals[i+1]) troughs.push(i);
    }
    return troughs;
  };

  const findPeaks = (vals: number[]) => {
    const peaks: number[] = [];
    for (let i = 1; i < vals.length - 1; i++) {
      if (vals[i] > vals[i-1] && vals[i] > vals[i+1]) peaks.push(i);
    }
    return peaks;
  };

  const rsiTroughs = findTroughs(recentRSI);
  const rsiPeaks = findPeaks(recentRSI);

  if (rsiTroughs.length >= 2) {
    const t1 = rsiTroughs[rsiTroughs.length - 2];
    const t2 = rsiTroughs[rsiTroughs.length - 1];
    
    // Bullish Divergence: RSI is rising but price is falling
    if (recentRSI[t2] > recentRSI[t1] && recentCandles[t2].low < recentCandles[t1].low) {
      signals.push({
        name: "Bullish RSI Divergence",
        type: "bullish",
        strength: 85,
        description: "Price made a lower low but RSI made a higher low, indicating weakening bearish momentum."
      });
    }
  }

  if (rsiPeaks.length >= 2) {
    const p1 = rsiPeaks[rsiPeaks.length - 2];
    const p2 = rsiPeaks[rsiPeaks.length - 1];

    // Bearish Divergence: RSI is falling but price is rising
    if (recentRSI[p2] < recentRSI[p1] && recentCandles[p2].high > recentCandles[p1].high) {
      signals.push({
        name: "Bearish RSI Divergence",
        type: "bearish",
        strength: 85,
        description: "Price made a higher high but RSI made a lower high, suggesting exhausted bullish volume."
      });
    }
  }

  return signals;
}

/**
 * Detects Bollinger Band Squeeze Breakouts.
 */
export function detectVolatilityBreakout(candles: Candle[]): PatternSignal | null {
  const closes = candles.map(c => c.close);
  const bb = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
  const lastBB = bb[bb.length - 1];
  const prevBB = bb[bb.length - 2];

  if (!lastBB || !prevBB) return null;

  const bandwidth = (lastBB.upper - lastBB.lower) / lastBB.middle;
  const prevBandwidth = (prevBB.upper - prevBB.lower) / prevBB.middle;
  
  const currentPrice = closes[closes.length - 1];

  // If we were in a squeeze (< 4% bandwidth) and it's starting to expand
  if (prevBandwidth < 0.04 && bandwidth > prevBandwidth) {
    if (currentPrice > lastBB.upper) {
      return {
        name: "Volatility Breakout",
        type: "bullish",
        strength: 75,
        description: "Price breaking above 20-period squeeze, indicating a high-momentum move up."
      };
    } else if (currentPrice < lastBB.lower) {
      return {
        name: "Volatility Breakdown",
        type: "bearish",
        strength: 75,
        description: "Price breaking below 20-period squeeze, indicating a high-momentum move down."
      };
    }
  }

  return null;
}
