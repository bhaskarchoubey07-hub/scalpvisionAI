/**
 * ai.ts
 *
 * Self-contained AI analysis service.
 * Primary: Uses Node.js technical analysis engine (no external dependency).
 * Optional: Calls Python AI service for LLM-powered explanations (graceful fallback).
 * NEVER throws "Bad Gateway" — the Python service is 100% optional.
 */

import { config } from "../config.js";
import { generateSignal, generateFallbackSummary, type SignalResult } from "./signalEngine.js";

/* ─────────────── Types ─────────────── */

export type AnalysisRequest = {
  imageUrl?: string;
  market: string;
  symbol?: string;
  timeframe?: string;
  current_price?: number;
  rsi?: number;
  macd_bias?: string;
};

export type AnalysisResult = {
  direction: string;
  signal: string;
  market: string;
  symbol: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward: number;
  confidence: number;
  summary: string;
  pattern: string | null;
  rsi: number | null;
  macd: string | null;
  timeframe: string;
  trend: string;
  atr: number;
  volatility_percent: number;
  current_price: number;
  indicators: Array<{
    name: string;
    value: string;
    bias: string;
    weight: number;
    score: number;
  }>;
  supports: number[];
  resistances: number[];
  pivot_point: number;
  timeframe_analysis: Array<{
    timeframe: string;
    direction: string;
    confidence: number;
    net_score: number;
  }>;
  patterns: Array<{
    name: string;
    type: string;
    strength: number;
    description: string;
  }>;
};

/* ─────────────── LLM Explanation (Optional) ─────────────── */

async function fetchAIExplanation(signal: SignalResult): Promise<string | null> {
  const aiServiceUrl = config.aiServiceUrl;
  if (!aiServiceUrl) return null;

  try {
    const response = await fetch(`${aiServiceUrl}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: signal.symbol,
        direction: signal.direction,
        confidence: signal.confidence,
        trend: signal.trend,
        current_price: signal.currentPrice,
        entry_price: signal.entryPrice,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        risk_reward: signal.riskReward,
        indicators: signal.indicators.map((i) => ({
          name: i.name,
          value: i.value,
          bias: i.bias,
        })),
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (response.ok) {
      const data = (await response.json()) as { explanation?: string };
      if (data.explanation) return data.explanation;
    }
  } catch {
    // Python service unavailable — this is fine, use fallback
  }

  return null;
}

/* ─────────────── Main Analysis Function ─────────────── */

export async function analyzeChart(request: AnalysisRequest): Promise<AnalysisResult> {
  const symbol = request.symbol || (request.market === "crypto" ? "BTCUSDT" : "SPY");
  const market = request.market || "stock";

  // 1. Run the real-time multi-indicator, multi-TF analysis
  const signal = await generateSignal(symbol, market);

  // 2. Try to get AI-powered explanation (optional, never blocks)
  let summary = await fetchAIExplanation(signal);
  if (!summary) {
    summary = generateFallbackSummary(signal);
  }
  signal.summary = summary;

  // 3. Find key indicator values for backward-compatible response
  const rsiIndicator = signal.indicators.find((i) => i.name.startsWith("RSI"));
  const macdIndicator = signal.indicators.find((i) => i.name === "MACD");

  // 4. Return in the format the frontend expects
  return {
    direction: signal.direction,
    signal: signal.signal,
    market: signal.market,
    symbol: signal.symbol,
    entry_price: signal.entryPrice,
    stop_loss: signal.stopLoss,
    take_profit: signal.takeProfit,
    risk_reward: signal.riskReward,
    confidence: signal.confidence,
    summary,
    pattern: signal.trend === "uptrend" ? "Bullish Trend" : signal.trend === "downtrend" ? "Bearish Trend" : "Consolidation",
    rsi: rsiIndicator?.numericValue ?? null,
    macd: macdIndicator?.value ?? null,
    timeframe: signal.timeframeAnalysis[0]?.timeframe ?? "1h",
    trend: signal.trend,
    atr: signal.atr,
    volatility_percent: signal.volatilityPercent,
    current_price: signal.currentPrice,
    indicators: signal.indicators.map((i) => ({
      name: i.name,
      value: i.value,
      bias: i.bias,
      weight: i.weight,
      score: i.score,
    })),
    supports: signal.supports,
    resistances: signal.resistances,
    pivot_point: signal.pivotPoint,
    timeframe_analysis: signal.timeframeAnalysis.map((t) => ({
      timeframe: t.timeframe,
      direction: t.direction,
      confidence: t.confidence,
      net_score: t.netScore,
    })),
    patterns: signal.patterns || [],
  };
}

/* ─────────────── Ticker-Only Analysis ─────────────── */

export async function analyzeTicker(
  symbol: string,
  market: string
): Promise<AnalysisResult> {
  return analyzeChart({ symbol, market });
}
