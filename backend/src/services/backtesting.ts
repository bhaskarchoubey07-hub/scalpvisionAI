import { fetchYahooCandles } from "./marketData.js";

export type TradeRecord = {
  symbol: string;
  type: "BUY" | "SELL";
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
};

export type BacktestResult = {
  net_profit: number;
  max_drawdown: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  cagr: number;
  profit_factor: number;
  expectancy: number;
  win_rate: number;
  loss_rate: number;
  total_trades: number;
  strategy_used: string;
  range_simulated: string;
  equity_curve: { date: string; equity: number }[];
  monthly_returns: Record<string, number>;
  trades: TradeRecord[];
};

/**
 * Upgraded Institutional-Grade Backtester (EMA 9/21/50 + RSI Confluence Strategy)
 */
export async function runBacktest(
  symbol: string,
  range: string,
  initialCapital = 10000
): Promise<BacktestResult> {
  const interval = range === "1d" || range === "5d" ? "15m" : "1d";
  const candles = await fetchYahooCandles(symbol, range, interval);

  if (candles.length < 50) {
    throw new Error(`Insufficient data for backtesting ${symbol} with range ${range}. Need at least 50 candles.`);
  }

  const closes = candles.map((c) => c.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);

  let capital = initialCapital;
  let positionSize = 0;
  let entryPrice = 0;
  let entryTime = "";
  let winCount = 0;
  let lossCount = 0;
  let totalTrades = 0;
  
  const trades: TradeRecord[] = [];
  const dailyEquity: { date: string; equity: number }[] = [];
  const dailyReturns: number[] = [];
  
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  for (let i = 50; i < candles.length; i++) {
    const price = candles[i].close;
    const dateStr = new Date(candles[i].time * 1000).toISOString().split("T")[0];
    
    const emaBullish = ema9[i] > ema21[i] && ema21[i] > ema50[i];
    const rsiOverbought = rsi[i] > 65;
    const prevEmaBullish = ema9[i - 1] > ema21[i - 1];

    if (positionSize === 0 && emaBullish && !prevEmaBullish) {
      positionSize = capital / price;
      entryPrice = price;
      entryTime = new Date(candles[i].time * 1000).toISOString();
      totalTrades++;
    } 
    else if (positionSize > 0 && ((ema9[i] < ema21[i]) || rsiOverbought)) {
      const pnl = positionSize * (price - entryPrice);
      const pnlPercent = ((price - entryPrice) / entryPrice) * 100;
      capital += pnl;
      
      if (pnl > 0) {
        winCount++;
        grossProfit += pnl;
      } else {
        lossCount++;
        grossLoss += Math.abs(pnl);
      }

      trades.push({
        symbol,
        type: "BUY",
        entryTime,
        exitTime: new Date(candles[i].time * 1000).toISOString(),
        entryPrice: +entryPrice.toFixed(2),
        exitPrice: +price.toFixed(2),
        pnl: +pnl.toFixed(2),
        pnlPercent: +pnlPercent.toFixed(2)
      });
      
      positionSize = 0;
    }

    const currentEquity = positionSize > 0 ? positionSize * price : capital;
    dailyEquity.push({ date: dateStr, equity: +currentEquity.toFixed(2) });
    
    if (dailyEquity.length > 1) {
      const prevEq = dailyEquity[dailyEquity.length - 2].equity;
      dailyReturns.push(prevEq > 0 ? (currentEquity - prevEq) / prevEq : 0);
    }

    if (currentEquity > peakCapital) peakCapital = currentEquity;
    const dd = (peakCapital - currentEquity) / peakCapital;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  if (positionSize > 0) {
    const finalCandle = candles[candles.length - 1];
    const price = finalCandle.close;
    const pnl = positionSize * (price - entryPrice);
    const pnlPercent = ((price - entryPrice) / entryPrice) * 100;
    capital += pnl;
    
    if (pnl > 0) {
      winCount++;
      grossProfit += pnl;
    } else {
      lossCount++;
      grossLoss += Math.abs(pnl);
    }

    trades.push({
      symbol,
      type: "BUY",
      entryTime,
      exitTime: new Date(finalCandle.time * 1000).toISOString(),
      entryPrice: +entryPrice.toFixed(2),
      exitPrice: +price.toFixed(2),
      pnl: +pnl.toFixed(2),
      pnlPercent: +pnlPercent.toFixed(2)
    });
  }

  const netProfit = capital - initialCapital;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0;

  const totalDays = (candles[candles.length - 1].time - candles[0].time) / (24 * 3600);
  const years = totalDays / 365.25;
  const cagr = years > 0.05 ? Math.pow(capital / initialCapital, 1 / years) - 1 : 0.0;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 10.0 : 1.0;

  const avgReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
  const dailyVar = dailyReturns.length > 1 
    ? dailyReturns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / dailyReturns.length
    : 0;
  const dailyStd = Math.sqrt(dailyVar);
  
  const riskFreeDaily = 0.05 / 252;
  const sharpe = dailyStd > 0 ? ((avgReturn - riskFreeDaily) / dailyStd) * Math.sqrt(252) : 0;

  const downsideReturns = dailyReturns.filter(r => r < 0);
  const downsideVar = downsideReturns.length > 0
    ? downsideReturns.map(x => Math.pow(x, 2)).reduce((a, b) => a + b, 0) / dailyReturns.length
    : 1e-8;
  const downsideStd = Math.sqrt(downsideVar);
  const sortino = downsideStd > 0 ? (avgReturn / downsideStd) * Math.sqrt(252) : sharpe;

  const avgWin = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
  const expectancy = totalTrades > 0 
    ? ((winRate / 100) * avgWin) - ((lossRate / 100) * avgLoss)
    : 0;

  const monthlyReturns: Record<string, number> = {};
  const monthlyGroups: Record<string, number[]> = {};
  
  for (let k = 1; k < dailyEquity.length; k++) {
    const date = dailyEquity[k].date;
    const key = date.substring(0, 7);
    const pct = dailyReturns[k - 1];
    
    if (!monthlyGroups[key]) monthlyGroups[key] = [];
    monthlyGroups[key].push(pct);
  }

  Object.entries(monthlyGroups).forEach(([key, pctList]) => {
    const compRet = pctList.reduce((acc, r) => acc * (1.0 + r), 1.0) - 1.0;
    monthlyReturns[key] = +(compRet * 100).toFixed(2);
  });

  return {
    net_profit: +netProfit.toFixed(2),
    max_drawdown: +(maxDrawdown * 100).toFixed(1),
    sharpe_ratio: +sharpe.toFixed(2),
    sortino_ratio: +sortino.toFixed(2),
    cagr: +(cagr * 100).toFixed(2),
    profit_factor: +profitFactor.toFixed(2),
    expectancy: +expectancy.toFixed(2),
    win_rate: +winRate.toFixed(1),
    loss_rate: +lossRate.toFixed(1),
    total_trades: totalTrades,
    strategy_used: "EMA-Confluence Quantitative Strategy",
    range_simulated: range,
    equity_curve: dailyEquity,
    monthly_returns: monthlyReturns,
    trades: trades
  };
}

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = new Array(data.length).fill(0);
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function calculateRSI(data: number[], period = 14): number[] {
  const rsi: number[] = new Array(data.length).fill(50);
  if (data.length < period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsi;
}
