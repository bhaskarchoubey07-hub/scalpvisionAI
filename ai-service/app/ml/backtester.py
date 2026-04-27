import pandas as pd
import numpy as np
from typing import Dict, Any, List

class Backtester:
    def __init__(self, initial_capital: float = 10000.0):
        self.initial_capital = initial_capital

    def run_backtest(self, df: pd.DataFrame, predictions: np.ndarray) -> Dict[str, Any]:
        """
        Simple vector-based backtest.
        predictions: Array of 0 (HOLD), 1 (BUY), 2 (SELL)
        """
        df = df.copy()
        df['signal'] = predictions
        
        # Calculate returns
        df['market_return'] = df['close'].pct_change()
        
        # Strategy return
        # BUY (1): next candle return
        # SELL (2): -next candle return
        # HOLD (0): 0
        df['strategy_signal'] = df['signal'].map({1: 1, 2: -1, 0: 0}).shift(1)
        df['strategy_return'] = df['strategy_signal'] * df['market_return']
        
        # Cumulative returns
        df['cum_market_return'] = (1 + df['market_return'].fillna(0)).cumprod()
        df['cum_strategy_return'] = (1 + df['strategy_return'].fillna(0)).cumprod()
        
        # PnL
        final_value = self.initial_capital * df['cum_strategy_return'].iloc[-1]
        total_pnl = final_value - self.initial_capital
        
        # Metrics
        total_trades = (df['signal'] != 0).sum()
        win_rate = 0
        if total_trades > 0:
            wins = (df['strategy_return'] > 0).sum()
            win_rate = (wins / total_trades) * 100
            
        # Drawdown
        cum_rets = df['cum_strategy_return']
        running_max = cum_rets.cummax()
        drawdown = (cum_rets - running_max) / running_max
        max_drawdown = drawdown.min() * 100
        
        # Sharpe Ratio (annualized, assuming hourly data)
        # 252 * 6.5 = 1638 trading hours per year
        sharpe = 0
        if df['strategy_return'].std() != 0:
            sharpe = (df['strategy_return'].mean() / df['strategy_return'].std()) * np.sqrt(1638)
            
        return {
            "initial_capital": self.initial_capital,
            "final_value": final_value,
            "total_pnl": total_pnl,
            "win_rate": win_rate,
            "max_drawdown": max_drawdown,
            "sharpe_ratio": sharpe,
            "total_trades": int(total_trades)
        }
