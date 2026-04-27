import pandas as pd
import numpy as np

class Labeler:
    def __init__(self, forward_window: int = 5, threshold_pct: float = 0.01):
        """
        forward_window: Number of candles to look ahead.
        threshold_pct: Price change threshold for BUY/SELL labels (e.g., 0.01 = 1%).
        """
        self.forward_window = forward_window
        self.threshold_pct = threshold_pct

    def label_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Label each candle as BUY (1), SELL (2), or HOLD (0).
        """
        # Calculate future return over next N candles
        df['future_max'] = df['high'].shift(-self.forward_window).rolling(window=self.forward_window).max()
        df['future_min'] = df['low'].shift(-self.forward_window).rolling(window=self.forward_window).min()
        
        # Calculate max potential upside/downside
        df['max_upside'] = (df['future_max'] - df['close']) / df['close']
        df['max_downside'] = (df['close'] - df['future_min']) / df['close']
        
        # Define labels
        conditions = [
            (df['max_upside'] > self.threshold_pct),
            (df['max_downside'] > self.threshold_pct)
        ]
        choices = [1, 2] # 1: BUY, 2: SELL
        
        df['target'] = np.select(conditions, choices, default=0) # 0: HOLD
        
        # Remove helper columns and drop last N rows where we don't have future data
        cols_to_drop = ['future_max', 'future_min', 'max_upside', 'max_downside']
        df = df.drop(columns=cols_to_drop)
        
        return df.dropna()
