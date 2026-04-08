/**
 * backtester.ts
 * 
 * Historical simulation engine for "training" the AI model.
 * Iterates through years of candles and measures the predictive accuracy
 * of each technical indicator to optimize weighted scoring.
 */

import { fetchYahooCandles } from "./marketData.js";
import { computeIndicators, type Candle } from "./technicalAnalysis.js";
import fs from "node:fs/promises";
import path from "node:path";

export type BacktestResult = {
  symbol: string;
  startDate: string;
  endDate: string;
  trades: number;
  winRate: number;
  avgProfit: number;
  maxDrawdown: number;
  indicatorPerformance: Array<{
    name: string;
    accuracy: number; // 0-1
    contribution: number;
  }>;
};

export type OptimizedWeights = {
  version: string;
  updatedAt: string;
  markets: Record<string, Record<string, number>>; // market -> indicator -> weight
};

const DATA_DIR = path.join(process.cwd(), "data", "calibration");

/**
 * Runs a 5-year backtest on a symbol to evaluate indicator performance.
 */
export async function runBacktest(symbol: string): Promise<BacktestResult> {
  const candles = await fetchYahooCandles(symbol, "5y", "1d");
  if (candles.length < 200) throw new Error("Insufficient data for backtesting");

  let trades = 0;
  let wins = 0;
  let totalProfit = 0;
  
  // Track how often each indicator's bias matched the eventual outcome
  const performanceMap: Record<string, { matches: number; total: number }> = {};

  // Sliding window backtest
  // We start at index 100 to have enough history for indicators
  for (let i = 100; i < candles.length - 10; i++) {
    const window = candles.slice(0, i + 1);
    const result = computeIndicators(window, symbol, "1d");
    
    if (!result || result.direction === "neutral") continue;

    const entryPrice = candles[i].close;
    // Look ahead 5 days to see outcome
    const futurePrice = candles[i + 5].close;
    const priceChange = (futurePrice - entryPrice) / entryPrice;
    
    const wasWin = (result.direction === "long" && priceChange > 0.02) || 
                   (result.direction === "short" && priceChange < -0.02);

    trades++;
    if (wasWin) wins++;
    totalProfit += priceChange;

    // Attribute performance to specific indicators
    result.indicators.forEach(ind => {
      if (!performanceMap[ind.name]) performanceMap[ind.name] = { matches: 0, total: 0 };
      
      const indWasRight = (ind.bias === "bullish" && priceChange > 0.01) ||
                          (ind.bias === "bearish" && priceChange < -0.01);
      
      performanceMap[ind.name].total++;
      if (indWasRight) performanceMap[ind.name].matches++;
    });
  }

  const indicatorPerformance = Object.entries(performanceMap).map(([name, stats]) => ({
    name,
    accuracy: stats.total > 0 ? stats.matches / stats.total : 0,
    contribution: 0 // Will be calculated after
  }));

  return {
    symbol,
    startDate: new Date(candles[0].time * 1000).toISOString(),
    endDate: new Date(candles[candles.length - 1].time * 1000).toISOString(),
    trades,
    winRate: trades > 0 ? wins / trades : 0,
    avgProfit: trades > 0 ? totalProfit / trades : 0,
    maxDrawdown: 0, // Simplified for now
    indicatorPerformance
  };
}

/**
 * Calibrates the weights for a specific market based on a basket of symbols.
 */
export async function calibrateMarket(market: string, symbols: string[]): Promise<OptimizedWeights> {
  console.log(`Starting calibration for market: ${market}...`);
  const allResults: BacktestResult[] = [];

  for (const sym of symbols) {
    try {
      const res = await runBacktest(sym);
      allResults.push(res);
      console.log(`- ${sym}: ${Math.round(res.winRate * 100)}% Win Rate`);
    } catch (err) {
      console.error(`- Failed backtest for ${sym}:`, err instanceof Error ? err.message : err);
    }
  }

  // Aggregate results
  const weightAggregator: Record<string, number[]> = {};
  allResults.forEach(res => {
    res.indicatorPerformance.forEach(ind => {
      if (!weightAggregator[ind.name]) weightAggregator[ind.name] = [];
      weightAggregator[ind.name].push(ind.accuracy);
    });
  });

  const finalWeights: Record<string, number> = {};
  Object.entries(weightAggregator).forEach(([name, accs]) => {
    const avgAcc = accs.reduce((a, b) => a + b, 0) / accs.length;
    // Normalize accuracy to a weight (base 10, adjusted by performance relative to 50%)
    finalWeights[name] = Math.round(10 + (avgAcc - 0.5) * 40);
  });

  const weights: OptimizedWeights = {
    version: "2.0.0",
    updatedAt: new Date().toISOString(),
    markets: { [market]: finalWeights }
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `weights-${market}.json`),
    JSON.stringify(weights, null, 2)
  );

  return weights;
}

export async function getOptimizedWeights(market: string): Promise<Record<string, number> | null> {
  try {
    const filePath = path.join(DATA_DIR, `weights-${market}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    const weights = JSON.parse(data) as OptimizedWeights;
    return weights.markets[market] || null;
  } catch {
    return null;
  }
}
