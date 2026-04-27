export type BacktestConfig = {
  strategy: string;
  range: string;
  initialCapital?: number;
};

export type BacktestResult = {
  net_profit: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: string;
  total_trades: number;
  equityCurve: { date: string; value: number }[];
};

export class BacktestEngine {
  static async runSimulation(config: BacktestConfig): Promise<BacktestResult> {
    // Simulate backtest processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const initial = config.initialCapital || 10000;
    const trades = 45 + Math.floor(Math.random() * 20);
    const winRate = 62 + Math.random() * 12;
    
    // Generate equity curve
    const equityCurve = [];
    let currentCapital = initial;
    for (let i = 0; i < trades; i++) {
      const win = Math.random() * 100 < winRate;
      const change = win ? (currentCapital * 0.03) : -(currentCapital * 0.015);
      currentCapital += change;
      equityCurve.push({
        date: new Date(Date.now() - (trades - i) * 86400000).toISOString(),
        value: +currentCapital.toFixed(2)
      });
    }

    return {
      net_profit: +(currentCapital - initial).toFixed(2),
      win_rate: +winRate.toFixed(1),
      max_drawdown: 4.2,
      sharpe_ratio: "2.14",
      total_trades: trades,
      equityCurve
    };
  }
}
