/**
 * signalEngine.ts
 *
 * Multi-timeframe confluence engine + ATR-based entry/stop/target placement.
 * Analyzes 1h, 4h, 1d timeframes and produces a weighted consensus signal.
 * All levels are dynamic and derived from real price volatility.
 */

import { fetchYahooCandles } from "./marketData.js";
import { computeIndicators, type TAResult, type IndicatorResult } from "./technicalAnalysis.js";
import { getOptimizedWeights } from "./backtester.js";

/* ─────────────── Types ─────────────── */

export type SignalResult = {
  symbol: string;
  market: string;
  direction: "long" | "short" | "neutral";
  signal: "BUY" | "SELL" | "HOLD" | "WATCH";
  confidence: number;
  trend: string;
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  atr: number;
  volatilityPercent: number;
  indicators: IndicatorResult[];
  supports: number[];
  resistances: number[];
  pivotPoint: number;
  timeframeAnalysis: TimeframeSignal[];
  patterns: any[]; // Using any[] here for simplicity as it matches TAResult's PatternSignal[]
  summary: string; // Will be filled by AI or fallback
};

export type TimeframeSignal = {
  timeframe: string;
  direction: "long" | "short" | "neutral";
  confidence: number;
  netScore: number;
  weight: number;
};

/* ─────────────── TF Config ─────────────── */

// Timeframe configs: defines which Yahoo API range/interval combos to use
// and the weight each TF contributes to the final consensus.
const TIMEFRAME_CONFIGS = [
  { label: "1h", range: "1mo", interval: "60m", weight: 0.25 },
  { label: "4h", range: "3mo", interval: "1d", weight: 0.35 },  // Yahoo doesn't have 4h; use 1d with 3mo for swing view
  { label: "1d", range: "1y", interval: "1d", weight: 0.40 },   // Wider history = more reliable trend
];

/* ─────────────── Main Signal Generation ─────────────── */

export async function generateSignal(
  symbol: string,
  market: string,
  primaryTimeframe?: string
): Promise<SignalResult> {
  // Load optimized weights for this market first
  const customWeights = (await getOptimizedWeights(market)) || {};
  console.log(`Analyzing ${symbol} with ${Object.keys(customWeights).length > 0 ? "OPTIMIZED" : "DEFAULT"} weights`);

  // 1. Fetch candles for multiple timeframes in parallel
  const tfPromises = TIMEFRAME_CONFIGS.map(async (tf) => {
    try {
      const candles = await fetchYahooCandles(symbol, tf.range, tf.interval);
      const analysis = computeIndicators(candles, symbol, tf.label, customWeights);
      return { tf, analysis };
    } catch (err) {
      console.error(`Failed to analyze ${symbol} on ${tf.label}:`, err);
      return { tf, analysis: null };
    }
  });

  const results = await Promise.all(tfPromises);
  const validResults = results.filter((r) => r.analysis !== null) as Array<{
    tf: (typeof TIMEFRAME_CONFIGS)[number];
    analysis: TAResult;
  }>;

  if (validResults.length === 0) {
    throw new Error(`Insufficient data for ${symbol}. Market may be closed or symbol invalid.`);
  }

  // 2. Use the most granular (first valid) for detailed indicators
  const primaryAnalysis = validResults[0].analysis;

  // 3. Multi-timeframe weighted consensus
  const timeframeAnalysis: TimeframeSignal[] = validResults.map((r) => ({
    timeframe: r.tf.label,
    direction: r.analysis.direction,
    confidence: r.analysis.confidence,
    netScore: r.analysis.netScore,
    weight: r.tf.weight,
  }));

  // Weighted average of net scores
  let totalWeight = 0;
  let weightedScore = 0;
  for (const ta of timeframeAnalysis) {
    weightedScore += ta.netScore * ta.weight;
    totalWeight += ta.weight;
  }
  const consensusScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Count how many TFs agree
  const longCount = timeframeAnalysis.filter((t) => t.direction === "long").length;
  const shortCount = timeframeAnalysis.filter((t) => t.direction === "short").length;
  const totalTFs = timeframeAnalysis.length;
  const agreementRatio = Math.max(longCount, shortCount) / totalTFs;

  // Final direction from consensus
  let direction: "long" | "short" | "neutral" = "neutral";
  if (consensusScore > 10 && longCount >= Math.ceil(totalTFs / 2)) direction = "long";
  else if (consensusScore < -10 && shortCount >= Math.ceil(totalTFs / 2)) direction = "short";

  // Confidence: blend primary analysis confidence with multi-TF agreement
  const mtfBonus = Math.round(agreementRatio * 15);
  const confidence = Math.min(99, Math.round(
    primaryAnalysis.confidence * 0.7 + mtfBonus + (Math.abs(consensusScore) * 0.15)
  ));

  // Signal label
  let signal: "BUY" | "SELL" | "HOLD" | "WATCH" = "HOLD";
  if (direction === "long" && confidence >= 65) signal = "BUY";
  else if (direction === "short" && confidence >= 65) signal = "SELL";
  else if (direction !== "neutral" && confidence >= 45) signal = "WATCH";

  // 4. ATR-based dynamic levels
  const currentPrice = primaryAnalysis.currentPrice;
  const atr = primaryAnalysis.atr || currentPrice * 0.02; // Fallback: 2% of price
  const { entryPrice, stopLoss, takeProfit, riskReward } = computeLevels(
    currentPrice,
    atr,
    direction,
    primaryAnalysis.supportResistance
  );

  // 5. Trend string
  const trend = primaryAnalysis.trend;

  return {
    symbol,
    market,
    direction,
    signal,
    confidence,
    trend,
    currentPrice: +currentPrice.toFixed(2),
    entryPrice: +entryPrice.toFixed(2),
    stopLoss: +stopLoss.toFixed(2),
    takeProfit: +takeProfit.toFixed(2),
    riskReward: +riskReward.toFixed(2),
    atr: +atr.toFixed(2),
    volatilityPercent: +primaryAnalysis.volatilityPercent.toFixed(2),
    indicators: primaryAnalysis.indicators,
    supports: primaryAnalysis.supportResistance.supports,
    resistances: primaryAnalysis.supportResistance.resistances,
    pivotPoint: primaryAnalysis.supportResistance.pivotPoint,
    timeframeAnalysis,
    patterns: primaryAnalysis.patterns,
    summary: "", // Filled later by AI explainer or fallback
  };
}

/* ─────────────── ATR-Based Level Computation ─────────────── */

function computeLevels(
  price: number,
  atr: number,
  direction: "long" | "short" | "neutral",
  sr: { supports: number[]; resistances: number[] }
) {
  // Use ATR multiples for SL and TP placement
  // SL: 1.5x ATR from entry (tight but respects volatility)
  // TP: 3x ATR from entry (2:1 R:R minimum)
  
  if (direction === "long") {
    // Entry slightly below current price (limit order idea)
    const entryPrice = price;
    
    // Stop below nearest support if available, otherwise use ATR
    const nearestSupport = sr.supports[0];
    const atrStop = price - 1.5 * atr;
    const stopLoss = nearestSupport && nearestSupport > atrStop && nearestSupport < price
      ? nearestSupport - 0.1 * atr // Just below support
      : atrStop;
    
    // Target at nearest resistance or ATR multiple, whichever is further
    const nearestResistance = sr.resistances[0];
    const atrTarget = price + 3 * atr;
    const takeProfit = nearestResistance && nearestResistance > price
      ? Math.max(nearestResistance, price + 2 * atr)
      : atrTarget;
    
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const riskReward = risk > 0 ? reward / risk : 0;
    
    return { entryPrice, stopLoss, takeProfit, riskReward };
  }
  
  if (direction === "short") {
    const entryPrice = price;
    
    // Stop above nearest resistance
    const nearestResistance = sr.resistances[0];
    const atrStop = price + 1.5 * atr;
    const stopLoss = nearestResistance && nearestResistance < atrStop && nearestResistance > price
      ? nearestResistance + 0.1 * atr
      : atrStop;
    
    // Target at nearest support or ATR multiple
    const nearestSupport = sr.supports[0];
    const atrTarget = price - 3 * atr;
    const takeProfit = nearestSupport && nearestSupport < price
      ? Math.min(nearestSupport, price - 2 * atr)
      : atrTarget;
    
    const risk = Math.abs(stopLoss - entryPrice);
    const reward = Math.abs(entryPrice - takeProfit);
    const riskReward = risk > 0 ? reward / risk : 0;
    
    return { entryPrice, stopLoss, takeProfit, riskReward };
  }
  
  // Neutral: small range
  return {
    entryPrice: price,
    stopLoss: +(price - 1.5 * atr).toFixed(2),
    takeProfit: +(price + 1.5 * atr).toFixed(2),
    riskReward: 1,
  };
}

/* ─────────────── Fallback Explanation Generator ─────────────── */

export function generateFallbackSummary(signal: SignalResult): string {
  const { symbol, direction, confidence, trend, indicators, currentPrice, entryPrice, stopLoss, takeProfit, riskReward, timeframeAnalysis } = signal;

  const cleanSymbol = symbol.replace(".NS", "").replace(".BO", "");
  const dirText = direction === "long" ? "bullish" : direction === "short" ? "bearish" : "neutral";
  
  // Find key indicators
  const rsiInd = indicators.find((i) => i.name.startsWith("RSI"));
  const macdInd = indicators.find((i) => i.name === "MACD");
  const emaInd = indicators.find((i) => i.name === "EMA Ribbon");
  const adxInd = indicators.find((i) => i.name.startsWith("ADX"));
  
  // TF agreement
  const agreeingTFs = timeframeAnalysis.filter((t) => t.direction === direction).length;
  const totalTFs = timeframeAnalysis.length;
  
  if (direction === "neutral") {
    return `${cleanSymbol} is currently showing mixed signals across ${totalTFs} timeframes with no clear directional edge. ` +
      `RSI at ${rsiInd?.value ?? "N/A"} and ${adxInd?.value ?? "low ADX"} suggest a ranging market. ` +
      `Recommend waiting for a clearer setup with stronger indicator confluence before taking a position.`;
  }
  
  return `Technical analysis identifies a ${dirText} setup for ${cleanSymbol} at ₹${currentPrice.toFixed(2)} with ${confidence}% confidence. ` +
    `${agreeingTFs}/${totalTFs} timeframes confirm the ${dirText} bias. ` +
    `Key factors: RSI at ${rsiInd?.value ?? "N/A"}, MACD showing ${macdInd?.value ?? "N/A"}, and ${emaInd?.value ?? "EMA alignment"} pattern. ` +
    `Entry at ₹${entryPrice.toFixed(2)}, stop-loss at ₹${stopLoss.toFixed(2)} (ATR-based), target ₹${takeProfit.toFixed(2)} for a ${riskReward.toFixed(1)}:1 risk-reward ratio. ` +
    `${adxInd?.numericValue && adxInd.numericValue > 25 ? "Strong trending conditions support this setup." : "Monitor ADX for trend strength confirmation."}`;
}
