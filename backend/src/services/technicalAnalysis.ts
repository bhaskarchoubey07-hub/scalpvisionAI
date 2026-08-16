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
  CCI,
  OBV,
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

  /* ── CCI (20) — Weight: 10 ── */
  try {
    const cciValues = CCI.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 20
    });
    const cciVal = last(cciValues);
    if (cciVal !== undefined) {
      let bias: "bullish" | "bearish" | "neutral" = "neutral";
      let score = 0;
      if (cciVal < -100) { bias = "bullish"; score = 10; }
      else if (cciVal > 100) { bias = "bearish"; score = 10; }
      
      if (bias === "bullish") bullScore += score;
      else if (bias === "bearish") bearScore += score;
      
      indicators.push({
        name: "CCI (20)",
        value: cciVal.toFixed(1),
        numericValue: cciVal,
        bias,
        weight: 10,
        score
      });
    }
  } catch { /* skip */ }

  /* ── OBV — Weight: 5 ── */
  try {
    const obvValues = OBV.calculate({
      close: closes,
      volume: volumes
    });
    const obvVal = last(obvValues);
    const obvPrev = secondLast(obvValues);
    if (obvVal !== undefined && obvPrev !== undefined) {
      const bias = obvVal > obvPrev ? "bullish" as const : "bearish" as const;
      const score = 5;
      if (bias === "bullish") bullScore += score;
      else bearScore += score;
      
      indicators.push({
        name: "OBV",
        value: obvVal > obvPrev ? "Rising" : "Falling",
        numericValue: obvVal,
        bias,
        weight: 5,
        score
      });
    }
  } catch { /* skip */ }

  /* ── SuperTrend (10,3) — Weight: 15 ── */
  try {
    const st = computeSuperTrend(candles);
    const score = 15;
    if (st.bias === "bullish") bullScore += score;
    else if (st.bias === "bearish") bearScore += score;
    
    indicators.push({
      name: "SuperTrend (10,3)",
      value: st.value,
      bias: st.bias,
      weight: 15,
      score
    });
  } catch { /* skip */ }

  /* ── VWAP (20) — Weight: 10 ── */
  try {
    const vwap = computeVWAP(candles);
    const score = 10;
    if (vwap.bias === "bullish") bullScore += score;
    else if (vwap.bias === "bearish") bearScore += score;
    
    indicators.push({
      name: "VWAP (20)",
      value: vwap.value,
      bias: vwap.bias,
      weight: 10,
      score
    });
  } catch { /* skip */ }

  /* ── Ichimoku Cloud — Weight: 10 ── */
  try {
    const ichi = computeIchimoku(candles);
    const score = 10;
    if (ichi.bias === "bullish") bullScore += score;
    else if (ichi.bias === "bearish") bearScore += score;
    
    indicators.push({
      name: "Ichimoku Cloud",
      value: ichi.value,
      bias: ichi.bias,
      weight: 10,
      score
    });
  } catch { /* skip */ }

  /* ── Market Structure & Order Flow — Weight: 15 ── */
  try {
    const struct = analyzeMarketStructure(candles);
    
    // Check BOS/CHoCH
    if (struct.structures.length > 0) {
      const latestStruct = struct.structures[struct.structures.length - 1];
      const score = 15;
      if (latestStruct.type === "bullish") {
        bullScore += score;
      } else {
        bearScore += score;
      }
      
      indicators.push({
        name: "Market Structure",
        value: latestStruct.name,
        bias: latestStruct.type,
        weight: 15,
        score
      });
    }
    
    // Check Order Blocks
    const bullOBs = struct.orderBlocks.filter(ob => ob.type === "bullish");
    const bearOBs = struct.orderBlocks.filter(ob => ob.type === "bearish");
    
    if (bullOBs.length > 0) {
      const nearestOB = bullOBs[bullOBs.length - 1];
      if (Math.abs(currentPrice - nearestOB.price) / currentPrice < 0.01) {
        bullScore += 10;
        indicators.push({
          name: "Order Block",
          value: `Near Bullish OB (${nearestOB.price.toFixed(2)})`,
          bias: "bullish",
          weight: 10,
          score: 10
        });
      }
    }
    if (bearOBs.length > 0) {
      const nearestOB = bearOBs[bearOBs.length - 1];
      if (Math.abs(currentPrice - nearestOB.price) / currentPrice < 0.01) {
        bearScore += 10;
        indicators.push({
          name: "Order Block",
          value: `Near Bearish OB (${nearestOB.price.toFixed(2)})`,
          bias: "bearish",
          weight: 10,
          score: 10
        });
      }
    }
    
    // Check FVGs
    const recentFVGs = struct.fvgs.slice(-2);
    recentFVGs.forEach(fvg => {
      const isFilling = fvg.type === "bullish" ? currentPrice > fvg.price : currentPrice < fvg.price;
      if (isFilling) {
        const score = 8;
        if (fvg.type === "bullish") bullScore += score;
        else bearScore += score;
        
        indicators.push({
          name: "Fair Value Gap",
          value: `Filling ${fvg.type.toUpperCase()} FVG (${fvg.price.toFixed(2)})`,
          bias: fvg.type,
          weight: 8,
          score
        });
      }
    });
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

/* ─────────────── Advanced Quantitative Indicators ─────────────── */

export function computeSuperTrend(candles: Candle[], period = 10, multiplier = 3) {
  if (candles.length < period + 1) return { bias: "neutral" as const, value: "N/A" };
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  
  const atrValues = ATR.calculate({ close: closes, high: highs, low: lows, period });
  
  let finalUpper = 0;
  let finalLower = 0;
  let superTrend = 0;
  let trend = 1;
  
  for (let i = period; i < candles.length; i++) {
    const atrIdx = i - period;
    const atr = atrValues[atrIdx] || (highs[i] - lows[i]);
    const hl2 = (highs[i] + lows[i]) / 2;
    
    const basicUpper = hl2 + multiplier * atr;
    const basicLower = hl2 - multiplier * atr;
    const prevClose = closes[i - 1];
    
    if (i === period) {
      finalUpper = basicUpper;
      finalLower = basicLower;
      superTrend = closes[i] > hl2 ? finalLower : finalUpper;
      trend = closes[i] > hl2 ? 1 : -1;
      continue;
    }
    
    if (basicUpper < finalUpper || prevClose > finalUpper) finalUpper = basicUpper;
    if (basicLower > finalLower || prevClose < finalLower) finalLower = basicLower;
    
    if (superTrend === finalUpper && closes[i] > finalUpper) {
      trend = 1;
      superTrend = finalLower;
    } else if (superTrend === finalLower && closes[i] < finalLower) {
      trend = -1;
      superTrend = finalUpper;
    } else {
      superTrend = trend === 1 ? finalLower : finalUpper;
    }
  }
  
  const currentTrend = trend === 1 ? "bullish" as const : "bearish" as const;
  return { bias: currentTrend, value: `${currentTrend.toUpperCase()} (ST:${superTrend.toFixed(2)})`, numericValue: superTrend };
}

export function computeVWAP(candles: Candle[]) {
  let totalPV = 0;
  let totalV = 0;
  const recent = candles.slice(-20);
  for (const c of recent) {
    const vol = c.volume || 1;
    totalPV += c.close * vol;
    totalV += vol;
  }
  const vwap = totalV > 0 ? totalPV / totalV : candles[candles.length - 1].close;
  const currentPrice = candles[candles.length - 1].close;
  const bias = currentPrice > vwap ? "bullish" as const : "bearish" as const;
  return { bias, value: `${bias.toUpperCase()} (VWAP:${vwap.toFixed(2)})`, numericValue: vwap };
}

export function computeIchimoku(candles: Candle[]) {
  if (candles.length < 52) return { bias: "neutral" as const, value: "N/A" };
  const getMinMax = (arr: Candle[], period: number) => {
    const slice = arr.slice(-period);
    const highs = slice.map(c => c.high);
    const lows = slice.map(c => c.low);
    return { max: Math.max(...highs), min: Math.min(...lows) };
  };
  const tenkanData = getMinMax(candles, 9);
  const tenkan = (tenkanData.max + tenkanData.min) / 2;
  const kijunData = getMinMax(candles, 26);
  const kijun = (kijunData.max + kijunData.min) / 2;
  const senkouA = (tenkan + kijun) / 2;
  const senkouBData = getMinMax(candles, 52);
  const senkouB = (senkouBData.max + senkouBData.min) / 2;
  
  const currentPrice = candles[candles.length - 1].close;
  let bias: "bullish" | "bearish" | "neutral" = "neutral";
  if (currentPrice > senkouA && currentPrice > senkouB) bias = "bullish";
  else if (currentPrice < senkouA && currentPrice < senkouB) bias = "bearish";
  
  return { bias, value: `${bias.toUpperCase()} (Cloud Top:${Math.max(senkouA, senkouB).toFixed(2)})`, numericValue: senkouA };
}

export function computeVolumeProfile(candles: Candle[]) {
  const recent = candles.slice(-50);
  const closes = recent.map(c => c.close);
  const minPrice = Math.min(...closes);
  const maxPrice = Math.max(...closes);
  const range = maxPrice - minPrice;
  const numBins = 10;
  const binWidth = range / numBins;
  
  const bins = new Array(numBins).fill(0).map((_, i) => ({
    low: minPrice + i * binWidth,
    high: minPrice + (i + 1) * binWidth,
    volume: 0
  }));
  
  for (const c of recent) {
    const binIdx = Math.min(numBins - 1, Math.floor((c.close - minPrice) / (binWidth + 1e-9)));
    bins[binIdx].volume += c.volume || 1;
  }
  
  let maxVol = 0;
  let hvnPrice = 0;
  let minVol = Infinity;
  let lvnPrice = 0;
  
  bins.forEach(b => {
    const mid = (b.low + b.high) / 2;
    if (b.volume > maxVol) {
      maxVol = b.volume;
      hvnPrice = mid;
    }
    if (b.volume < minVol) {
      minVol = b.volume;
      lvnPrice = mid;
    }
  });
  
  return { hvnPrice, lvnPrice, bins };
}

export type StructureResult = {
  structures: { name: string; price: number; type: "bullish" | "bearish" }[];
  orderBlocks: { price: number; type: "bullish" | "bearish"; volume: number }[];
  fvgs: { price: number; type: "bullish" | "bearish"; size: number }[];
};

export function analyzeMarketStructure(candles: Candle[]): StructureResult {
  const structures: StructureResult["structures"] = [];
  const orderBlocks: StructureResult["orderBlocks"] = [];
  const fvgs: StructureResult["fvgs"] = [];
  
  if (candles.length < 10) return { structures, orderBlocks, fvgs };
  
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];
    if (c3.low > c1.high) {
      fvgs.push({ price: (c3.low + c1.high) / 2, type: "bullish", size: c3.low - c1.high });
    } else if (c3.high < c1.low) {
      fvgs.push({ price: (c3.high + c1.low) / 2, type: "bearish", size: c1.low - c3.high });
    }
  }
  
  for (let i = 4; i < candles.length - 1; i++) {
    const c = candles[i];
    const nextC = candles[i + 1];
    const bodySize = Math.abs(c.close - c.open);
    const nextBody = Math.abs(nextC.close - nextC.open);
    const isImpulsiveUp = nextC.close > nextC.open && nextBody > bodySize * 1.5;
    const isImpulsiveDown = nextC.close < nextC.open && nextBody > bodySize * 1.5;
    if (isImpulsiveUp && c.close < c.open) {
      orderBlocks.push({ price: c.close, type: "bullish", volume: c.volume || 0 });
    } else if (isImpulsiveDown && c.close > c.open) {
      orderBlocks.push({ price: c.close, type: "bearish", volume: c.volume || 0 });
    }
  }
  
  const swings: { idx: number; price: number; type: "high" | "low" }[] = [];
  for (let i = 3; i < candles.length - 3; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const isSwingHigh = high > candles[i - 1].high && high > candles[i - 2].high &&
                        high > candles[i + 1].high && high > candles[i + 2].high;
    const isSwingLow = low < candles[i - 1].low && low < candles[i - 2].low &&
                       low < candles[i + 1].low && low < candles[i + 2].low;
    if (isSwingHigh) swings.push({ idx: i, price: high, type: "high" });
    if (isSwingLow) swings.push({ idx: i, price: low, type: "low" });
  }
  
  const currentPrice = candles[candles.length - 1].close;
  const recentHighs = swings.filter(s => s.type === "high").slice(-3);
  const recentLows = swings.filter(s => s.type === "low").slice(-3);
  
  if (recentHighs.length > 1) {
    const lastHigh = recentHighs[recentHighs.length - 1];
    const prevHigh = recentHighs[recentHighs.length - 2];
    if (currentPrice > lastHigh.price) {
      const type = lastHigh.price > prevHigh.price ? "BOS" : "CHoCH";
      structures.push({ name: `${type} (Bullish)`, price: lastHigh.price, type: "bullish" });
    }
  }
  
  if (recentLows.length > 1) {
    const lastLow = recentLows[recentLows.length - 1];
    const prevLow = recentLows[recentLows.length - 2];
    if (currentPrice < lastLow.price) {
      const type = lastLow.price < prevLow.price ? "BOS" : "CHoCH";
      structures.push({ name: `${type} (Bearish)`, price: lastLow.price, type: "bearish" });
    }
  }
  
  return { structures, orderBlocks, fvgs };
}

