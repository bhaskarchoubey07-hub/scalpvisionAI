export interface BacktestConfig {
  strategy: string;
  range: string;
  initialCapital?: number;
}

export interface BacktestResult {
  net_profit: number;
  max_drawdown: string;
  sharpe_ratio: string;
  total_trades: number;
  win_rate: number;
  equityCurve: { date: string; value: number }[];
}

export const runBacktest = async (config: BacktestConfig): Promise<BacktestResult> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate mock data (100 days of price action)
  const dataSize = 100;
  let currentPrice = 100;
  const prices: number[] = [];
  for (let i = 0; i < dataSize; i++) {
    currentPrice += (Math.random() - 0.48) * 5; // Slight bullish bias
    prices.push(currentPrice);
  }

  // Simple MA Crossover Strategy
  const shortMA_period = 9;
  const longMA_period = 21;
  const trades: { entry: number; exit: number; profit: number }[] = [];
  let position: number | null = null;
  let capital = config.initialCapital || 10000;
  const initialCapital = capital;
  const equityCurve: { date: string; value: number }[] = [];

  for (let i = longMA_period; i < dataSize; i++) {
    const shortMA = prices.slice(i - shortMA_period, i).reduce((a, b) => a + b, 0) / shortMA_period;
    const longMA = prices.slice(i - longMA_period, i).reduce((a, b) => a + b, 0) / longMA_period;

    const price = prices[i];

    if (!position && shortMA > longMA) {
      // BUY
      position = price;
    } else if (position && shortMA < longMA) {
      // SELL
      const profit = (price - position) / position * capital;
      trades.push({ entry: position, exit: price, profit });
      capital += profit;
      position = null;
    }
    
    equityCurve.push({ 
      date: new Date(Date.now() - (dataSize - i) * 86400000).toISOString().split('T')[0], 
      value: capital 
    });
  }

  const wins = trades.filter(t => t.profit > 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const netProfit = capital - initialCapital;
  
  // Basic metrics for demonstration
  return {
    net_profit: parseFloat(netProfit.toFixed(2)),
    max_drawdown: "4.2",
    sharpe_ratio: "1.8",
    total_trades: trades.length,
    win_rate: parseFloat(winRate.toFixed(2)),
    equityCurve
  };
};
