/**
 * technicalAnalysis.ts
 * 
 * Production-grade multi-indicator technical analysis engine.
 * Computes 9+ indicators from real OHLCV candle data fetched via Yahoo Finance.
 * No dummy data — everything is derived from actual market prices.
 */

import {
  RSI,
  MACD,
  BollingerBands,
  EMA,
  ATR,
  StochasticRSI,
  ADX,
  SMA,
} from "technicalindicators";

import { detectDivergences, detectVolatilityBreakout, type PatternSignal } from "./patternEngine.js";
import { getOptimizedWeights } from "./backtester.js";

/* ─────────────── Types ─────────────── */

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type IndicatorResult = {
  name: string;
  value: string;
  numericValue?: number;
  bias: "bullish" | "bearish" | "neutral";
  weight: number; // 0-100 contribution weight
  score: number;  // weighted score for this indicator
};

export type SupportResistance = {
  supports: number[];
  resistances: number[];
  pivotPoint: number;
};

export type TAResult = {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  indicators: IndicatorResult[];
  patterns: PatternSignal[];
  totalBullScore: number;
  totalBearScore: number;
  totalNeutralScore: number;
  netScore: number; // -100 (max bearish) to +100 (max bullish)
  direction: "long" | "short" | "neutral";
  confidence: number; // 0-99
  trend: "uptrend" | "downtrend" | "sideways";
  supportResistance: SupportResistance;
  atr: number;
  volatilityPercent: number;
};

/* ─────────────── Helpers ─────────────── */

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

function secondLast<T>(arr: T[]): T | undefined {
  return arr[arr.length - 2];
}

function safeSlice(arr: number[], count: number): number[] {
  return arr.slice(Math.max(0, arr.length - count));
}

/* ─────────────── Main Analysis Function ─────────────── */

export function computeIndicators(
  candles: Candle[],
  symbol: string,
  timeframe: string,
  customWeights: Record<string, number> = {}
): TAResult | null {
  if (!candles || candles.length < 30) {
    return null; // Need at least 30 candles for reliable indicators
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume ?? 0);
  const currentPrice = closes[closes.length - 1];

  const indicators: IndicatorResult[] = [];
  let bullScore = 0;
  let bearScore = 0;

  /* ── Pattern Detection ── */
  const patterns = [
    ...detectDivergences(candles),
    ...(detectVolatilityBreakout(candles) ? [detectVolatilityBreakout(candles)!] : [])
  ];

  patterns.forEach(p => {
    if (p.type === "bullish") bullScore += (p.strength / 5); // Patterns carry significant weight
    else bearScore += (p.strength / 5);
  });

  /* ── 1. RSI (14) — Weight: 15 ── */
  try {
    const weight = customWeights["RSI (14)"] || 15;
    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    const rsi = last(rsiValues);
    if (rsi !== undefined) {
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;
      if (rsi < 30) { bias = "bullish"; score = weight; }
      else if (rsi < 40) { bias = "bullish"; score = weight * 0.6; }
      else if (rsi > 70) { bias = "bearish"; score = weight; }
      else if (rsi > 60) { bias = "bearish"; score = weight * 0.6; }

      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;

      indicators.push({
        name: "RSI (14)",
        value: rsi.toFixed(1),
        numericValue: rsi,
        bias,
        weight,
        score,
      });
    }
  } catch { /* skip */ }

  /* ── 2. MACD (12,26,9) — Weight: 20 ── */
  try {
    const weight = customWeights["MACD"] || 20;
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const macdCurrent = last(macdValues);
    const macdPrev = secondLast(macdValues);

    if (macdCurrent && macdCurrent.MACD !== undefined && macdCurrent.signal !== undefined) {
      const histogram = macdCurrent.histogram ?? 0;
      const prevHistogram = macdPrev?.histogram ?? 0;
      
      // Check crossover
      const bullishCross = (prevHistogram <= 0 && histogram > 0);
      const bearishCross = (prevHistogram >= 0 && histogram < 0);
      
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;
      
      if (bullishCross) { bias = "bullish"; score = 20; }
      else if (bearishCross) { bias = "bearish"; score = 20; }
      else if (histogram > 0 && histogram > prevHistogram) { bias = "bullish"; score = 14; }
      else if (histogram > 0) { bias = "bullish"; score = 8; }
      else if (histogram < 0 && histogram < prevHistogram) { bias = "bearish"; score = 14; }
      else if (histogram < 0) { bias = "bearish"; score = 8; }

      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;

      indicators.push({
        name: "MACD",
        value: bullishCross ? "Bullish Cross" : bearishCross ? "Bearish Cross" : histogram > 0 ? "Bullish" : "Bearish",
        numericValue: histogram,
        bias,
        weight: 20,
        score,
      });
    }
  } catch { /* skip */ }

  /* ── 3. EMA Ribbon (9, 21, 50, 200) — Weight: 15 ── */
  try {
    const ema9 = last(EMA.calculate({ values: closes, period: 9 }));
    const ema21 = last(EMA.calculate({ values: closes, period: 21 }));
    const ema50 = last(EMA.calculate({ values: closes, period: 50 }));
    const ema200 = closes.length >= 200 ? last(EMA.calculate({ values: closes, period: 200 })) : undefined;

    if (ema9 !== undefined && ema21 !== undefined && ema50 !== undefined) {
      // Perfect bullish alignment: price > ema9 > ema21 > ema50
      const bullishAlignment = currentPrice > ema9 && ema9 > ema21 && ema21 > ema50;
      // Perfect bearish alignment: price < ema9 < ema21 < ema50
      const bearishAlignment = currentPrice < ema9 && ema9 < ema21 && ema21 < ema50;
      // Partial conditions
      const aboveEma21 = currentPrice > ema21;
      const belowEma21 = currentPrice < ema21;
      
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;
      let label = "Mixed";

      if (bullishAlignment) { bias = "bullish"; score = 15; label = "Bullish Alignment"; }
      else if (bearishAlignment) { bias = "bearish"; score = 15; label = "Bearish Alignment"; }
      else if (aboveEma21 && ema9 > ema21) { bias = "bullish"; score = 8; label = "Above EMA21"; }
      else if (belowEma21 && ema9 < ema21) { bias = "bearish"; score = 8; label = "Below EMA21"; }

      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;

      const emaDetail = ema200 !== undefined
        ? `9:${ema9.toFixed(2)} 21:${ema21.toFixed(2)} 50:${ema50.toFixed(2)} 200:${ema200.toFixed(2)}`
        : `9:${ema9.toFixed(2)} 21:${ema21.toFixed(2)} 50:${ema50.toFixed(2)}`;

      indicators.push({
        name: "EMA Ribbon",
        value: label,
        bias,
        weight: 15,
        score,
      });
    }
  } catch { /* skip */ }

  /* ── 4. Bollinger Bands (20, 2) — Weight: 10 ── */
  try {
    const bbValues = BollingerBands.calculate({
      values: closes,
      period: 20,
      stdDev: 2,
    });
    const bb = last(bbValues);
    const bbPrev = secondLast(bbValues);

    if (bb) {
      const bandwidth = (bb.upper - bb.lower) / bb.middle;
      const isSqueeze = bandwidth < 0.04; // Tight squeeze
      const atLowerBand = currentPrice <= bb.lower * 1.005;
      const atUpperBand = currentPrice >= bb.upper * 0.995;
      
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;
      let label = "Inside Bands";

      if (atLowerBand) { bias = "bullish"; score = isSqueeze ? 10 : 7; label = isSqueeze ? "Lower Band + Squeeze" : "At Lower Band"; }
      else if (atUpperBand) { bias = "bearish"; score = isSqueeze ? 10 : 7; label = isSqueeze ? "Upper Band + Squeeze" : "At Upper Band"; }
      else if (isSqueeze) { label = "Squeeze (Breakout Pending)"; score = 3; }
      else if (currentPrice < bb.middle) { bias = "bearish"; score = 3; label = "Below Middle Band"; }
      else { bias = "bullish"; score = 3; label = "Above Middle Band"; }

      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;

      indicators.push({
        name: "Bollinger Bands",
        value: label,
        numericValue: bandwidth,
        bias,
        weight: 10,
        score,
      });
    }
  } catch { /* skip */ }

  /* ── 5. ADX (14) — Weight: 10 ── */
  try {
    const adxValues = ADX.calculate({
      close: closes,
      high: highs,
      low: lows,
      period: 14,
    });
    const adx = last(adxValues);

    if (adx) {
      const adxVal = adx.adx;
      const pdi = adx.pdi;
      const mdi = adx.mdi;
      
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;
      let label = "Weak Trend";

      if (adxVal > 25) {
        // Strong trend — direction from DI
        if (pdi > mdi) { bias = "bullish"; score = 10; label = `Strong Trend (ADX ${adxVal.toFixed(0)})`; }
        else { bias = "bearish"; score = 10; label = `Strong Trend (ADX ${adxVal.toFixed(0)})`; }
      } else if (adxVal > 20) {
        if (pdi > mdi) { bias = "bullish"; score = 5; label = `Moderate (ADX ${adxVal.toFixed(0)})`; }
        else { bias = "bearish"; score = 5; label = `Moderate (ADX ${adxVal.toFixed(0)})`; }
      } else {
        // Choppy market
        label = `Choppy (ADX ${adxVal.toFixed(0)})`;
        score = 0;
      }

      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;

      indicators.push({
        name: "ADX (14)",
        value: label,
        numericValue: adxVal,
        bias,
        weight: 10,
        score,
      });
    }
  } catch { /* skip */ }

  /* ── 6. Stochastic RSI — Weight: 10 ── */
  try {
    const stochRsiValues = StochasticRSI.calculate({
      values: closes,
      rsiPeriod: 14,
      stochasticPeriod: 14,
      kPeriod: 3,
      dPeriod: 3,
    });
    const stochRsi = last(stochRsiValues);
    const stochRsiPrev = secondLast(stochRsiValues);

    if (stochRsi && stochRsi.k !== undefined && stochRsi.d !== undefined) {
      const k = stochRsi.k;
      const d = stochRsi.d;
      const prevK = stochRsiPrev?.k ?? k;
      const prevD = stochRsiPrev?.d ?? d;
      
      const bullishCross = prevK <= prevD && k > d && k < 30;
      const bearishCross = prevK >= prevD && k < d && k > 70;
      
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;

      if (bullishCross || k < 20) { bias = "bullish"; score = bullishCross ? 10 : 6; }
      else if (bearishCross || k > 80) { bias = "bearish"; score = bearishCross ? 10 : 6; }
      else if (k < 40) { bias = "bullish"; score = 3; }
      else if (k > 60) { bias = "bearish"; score = 3; }

      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;

      indicators.push({
        name: "Stochastic RSI",
        value: `K:${k.toFixed(1)} D:${d.toFixed(1)}`,
        numericValue: k,
        bias,
        weight: 10,
        score,
      });
    }
  } catch { /* skip */ }

  /* ── 7. Volume Analysis — Weight: 10 ── */
  try {
    if (volumes.some((v) => v > 0)) {
      const recentVolumes = safeSlice(volumes, 20);
      const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
      const currentVolume = volumes[volumes.length - 1];
      const volRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
      
      // Volume should confirm direction (high volume = conviction)
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;
      let label = "Average";

      if (volRatio > 1.5) {
        // High volume — check price direction to determine bias
        const priceChange = closes[closes.length - 1] - closes[closes.length - 2];
        if (priceChange > 0) { bias = "bullish"; score = 10; label = `High Vol (${volRatio.toFixed(1)}x avg)`; }
        else { bias = "bearish"; score = 10; label = `High Vol (${volRatio.toFixed(1)}x avg)`; }
      } else if (volRatio > 1.0) {
        score = 3;
        label = `Above Avg (${volRatio.toFixed(1)}x)`;
      } else {
        label = `Below Avg (${volRatio.toFixed(1)}x)`;
        score = 0;
      }

      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;

      indicators.push({
        name: "Volume",
        value: label,
        numericValue: volRatio,
        bias,
        weight: 10,
        score,
      });
    }
  } catch { /* skip */ }

  /* ── 8. ATR (14) — For Volatility & Level Placement ── */
  let atrValue = 0;
  try {
    const atrValues = ATR.calculate({
      close: closes,
      high: highs,
      low: lows,
      period: 14,
    });
    atrValue = last(atrValues) ?? 0;
  } catch { /* skip */ }

  /* ── 9. Support / Resistance from Pivot Points ── */
  const sr = computeSupportResistance(candles, currentPrice);

  /* ── Aggregate Scores ── */
  const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
  const maxPossibleScore = totalWeight; // Maximum possible score

  // Net score: positive = bullish, negative = bearish
  const netScore = bullScore - bearScore;
  const normalizedScore = maxPossibleScore > 0
    ? Math.round((netScore / maxPossibleScore) * 100)
    : 0;

  // Direction
  let direction: "long" | "short" | "neutral" = "neutral";
  if (normalizedScore > 15) direction = "long";
  else if (normalizedScore < -15) direction = "short";

  // Confidence: how strongly indicators agree (absolute value of conviction + ADX bonus)
  const adxIndicator = indicators.find((i) => i.name === "ADX (14)");
  const adxBonus = (adxIndicator?.numericValue ?? 0) > 25 ? 10 : 0;
  const agreementRatio = maxPossibleScore > 0
    ? Math.abs(netScore) / maxPossibleScore
    : 0;
  const confidence = Math.min(99, Math.round(agreementRatio * 85) + adxBonus + 10);

  // Trend
  let trend: "uptrend" | "downtrend" | "sideways" = "sideways";
  if (normalizedScore > 20) trend = "uptrend";
  else if (normalizedScore < -20) trend = "downtrend";

  const volatilityPercent = currentPrice > 0 ? (atrValue / currentPrice) * 100 : 0;

  return {
    symbol,
    timeframe,
    currentPrice,
    indicators,
    patterns,
    totalBullScore: bullScore,
    totalBearScore: bearScore,
    totalNeutralScore: Math.max(0, maxPossibleScore - bullScore - bearScore),
    netScore: normalizedScore,
    direction,
    confidence,
    trend,
    supportResistance: sr,
    atr: atrValue,
    volatilityPercent: volatilityPercent,
  };
}

/* ─────────────── Support & Resistance from Pivots ─────────────── */

function computeSupportResistance(candles: Candle[], currentPrice: number): SupportResistance {
  // Use recent candle data to find pivot points
  const recent = candles.slice(-60); // Last 60 candles
  
  if (recent.length < 5) {
    return { supports: [], resistances: [], pivotPoint: currentPrice };
  }

  // Classic Pivot Points from most recent complete candle
  const lastCandle = recent[recent.length - 2]; // Previous complete candle
  const h = lastCandle.high;
  const l = lastCandle.low;
  const c = lastCandle.close;
  const pivot = (h + l + c) / 3;
  
  const r1 = 2 * pivot - l;
  const r2 = pivot + (h - l);
  const r3 = h + 2 * (pivot - l);
  const s1 = 2 * pivot - h;
  const s2 = pivot - (h - l);
  const s3 = l - 2 * (h - pivot);

  // Also find swing highs and lows from recent data
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  
  for (let i = 2; i < recent.length - 2; i++) {
    const isSwingHigh = recent[i].high > recent[i - 1].high &&
                        recent[i].high > recent[i - 2].high &&
                        recent[i].high > recent[i + 1].high &&
                        recent[i].high > recent[i + 2].high;
    const isSwingLow = recent[i].low < recent[i - 1].low &&
                       recent[i].low < recent[i - 2].low &&
                       recent[i].low < recent[i + 1].low &&
                       recent[i].low < recent[i + 2].low;
    
    if (isSwingHigh) swingHighs.push(recent[i].high);
    if (isSwingLow) swingLows.push(recent[i].low);
  }

  // Combine pivot levels and swing levels, filter relative to price
  const allSupports = [s1, s2, s3, ...swingLows]
    .filter((s) => s < currentPrice && s > 0)
    .sort((a, b) => b - a) // Nearest first
    .slice(0, 4);

  const allResistances = [r1, r2, r3, ...swingHighs]
    .filter((r) => r > currentPrice)
    .sort((a, b) => a - b) // Nearest first
    .slice(0, 4);

  return {
    supports: allSupports.map((s) => +s.toFixed(2)),
    resistances: allResistances.map((r) => +r.toFixed(2)),
    pivotPoint: +pivot.toFixed(2),
  };
}
