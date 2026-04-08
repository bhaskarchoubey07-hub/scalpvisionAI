import { fetchYahooCandles } from "./marketData.js";

export type BacktestResult = {
  net_profit: number;
  max_drawdown: number;
  sharpe_ratio: number;
  total_trades: number;
  win_rate: number;
  strategy_used: string;
  range_simulated: string;
};

/**
 * Simple Trend-Following Backtester (SMA 20/50 Crossover)
 */
export async function runBacktest(
  symbol: string,
  range: string,
  initialCapital = 10000
): Promise<BacktestResult> {
  // 1. Fetch historical data (using 1d interval for range > 1mo)
  const interval = range === "1d" || range === "5d" ? "15m" : "1d";
  const candles = await fetchYahooCandles(symbol, range, interval);

  if (candles.length < 50) {
    throw new Error(`Insufficient data for backtesting ${symbol} with range ${range}. Need at least 50 candles.`);
  }

  // 2. Indicators (SMA 20, SMA 50)
  const sma20 = calculateSMA(candles.map((c) => c.close), 20);
  const sma50 = calculateSMA(candles.map((c) => c.close), 50);

  let capital = initialCapital;
  let positionSize = 0;
  let entryPrice = 0;
  let winCount = 0;
  let totalTrades = 0;
  const tradePnl: number[] = [];
  let peakCapital = initialCapital;
  let maxDrawdown = 0;

  // 3. Simulation Loop
  for (let i = 50; i < candles.length; i++) {
    const price = candles[i].close;
    const isBullCrossover = sma20[i] > sma50[i] && sma20[i - 1] <= sma50[i - 1];
    const isBearCrossover = sma20[i] < sma50[i] && sma20[i - 1] >= sma50[i - 1];

    // Buy Signal
    if (positionSize === 0 && isBullCrossover) {
      positionSize = capital / price;
      entryPrice = price;
      totalTrades++;
    } 
    // Sell Signal
    else if (positionSize > 0 && isBearCrossover) {
      const pnl = positionSize * (price - entryPrice);
      capital += pnl;
      tradePnl.push(pnl);
      if (pnl > 0) winCount++;
      positionSize = 0;
    }

    // Tracking DD
    const currentEquity = positionSize > 0 ? positionSize * price : capital;
    if (currentEquity > peakCapital) peakCapital = currentEquity;
    const dd = (peakCapital - currentEquity) / peakCapital;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Close open position at the end
  if (positionSize > 0) {
    const price = candles[candles.length - 1].close;
    const pnl = positionSize * (price - entryPrice);
    capital += pnl;
    tradePnl.push(pnl);
    if (pnl > 0) winCount++;
  }

  const netProfit = capital - initialCapital;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  
  // Simple Sharpe approximation (standard deviation of trade pnl)
  const avgPnl = tradePnl.length ? tradePnl.reduce((a, b) => a + b, 0) / tradePnl.length : 0;
  const stdPnl = tradePnl.length > 1 
    ? Math.sqrt(tradePnl.map(x => Math.pow(x - avgPnl, 2)).reduce((a, b) => a + b, 0) / tradePnl.length)
    : 1;
  const sharpe = stdPnl !== 0 ? (avgPnl / stdPnl) * Math.sqrt(totalTrades || 1) : 0;

  return {
    net_profit: +netProfit.toFixed(2),
    max_drawdown: +(maxDrawdown * 100).toFixed(1),
    sharpe_ratio: +sharpe.toFixed(2),
    total_trades: totalTrades,
    win_rate: +winRate.toFixed(1),
    strategy_used: "SMA-20/50 Trend Follower",
    range_simulated: range
  };
}

function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = new Array(data.length).fill(0);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  return sma;
}
