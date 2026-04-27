import pandas as pd
import pandas_ta as ta
import numpy as np

class FeatureEngineer:
    def __init__(self):
        pass

    def add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add RSI, MACD, MA, Bollinger Bands, Volume spikes.
        """
        # RSI
        df['rsi'] = ta.rsi(df['close'], length=14)
        
        # MACD
        macd = ta.macd(df['close'])
        df = pd.concat([df, macd], axis=1)
        
        # Moving Averages
        df['ma20'] = ta.sma(df['close'], length=20)
        df['ma50'] = ta.sma(df['close'], length=50)
        df['ma200'] = ta.sma(df['close'], length=200)
        
        # EMA
        df['ema20'] = ta.ema(df['close'], length=20)
        
        # Bollinger Bands
        bb = ta.bbands(df['close'], length=20, std=2)
        df = pd.concat([df, bb], axis=1)
        
        # ATR (Volatility)
        df['atr'] = ta.atr(df['high'], df['low'], df['close'], length=14)
        
        # Volume spikes
        df['vol_ma20'] = ta.sma(df['volume'], length=20)
        df['vol_spike'] = df['volume'] > (df['vol_ma20'] * 1.5)
        
        return df

    def add_candlestick_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect Engulfing, Doji, Hammer, Shooting star.
        """
        # Using pandas_ta's CDL patterns if available, or manual logic
        # For this example, let's use manual robust logic for key patterns
        
        # Body and shadows
        body = abs(df['close'] - df['open'])
        candle_range = df['high'] - df['low']
        upper_shadow = df['high'] - df[['open', 'close']].max(axis=1)
        lower_shadow = df[['open', 'close']].min(axis=1) - df['low']
        
        # Doji: Body is very small compared to range
        df['pattern_doji'] = body < (candle_range * 0.1)
        
        # Hammer: Lower shadow is at least 2x body, small upper shadow, at bottom of trend
        df['pattern_hammer'] = (lower_shadow > (2 * body)) & (upper_shadow < (0.1 * candle_range))
        
        # Shooting Star: Upper shadow is at least 2x body, small lower shadow
        df['pattern_shooting_star'] = (upper_shadow > (2 * body)) & (lower_shadow < (0.1 * candle_range))
        
        # Engulfing (requires previous candle)
        df['prev_open'] = df['open'].shift(1)
        df['prev_close'] = df['close'].shift(1)
        
        df['pattern_bullish_engulfing'] = (df['open'] < df['prev_close']) & \
                                         (df['close'] > df['prev_open']) & \
                                         (df['prev_close'] < df['prev_open'])
                                         
        df['pattern_bearish_engulfing'] = (df['open'] > df['prev_close']) & \
                                         (df['close'] < df['prev_open']) & \
                                         (df['prev_close'] > df['prev_open'])
        
        return df

    def add_market_structure(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect Trend (HH/HL, LH/LL), Breakouts, Support/Resistance.
        """
        # Local Max/Min for Support/Resistance
        df['pivot_high'] = df['high'][(df['high'] > df['high'].shift(1)) & (df['high'] > df['high'].shift(-1))]
        df['pivot_low'] = df['low'][(df['low'] < df['low'].shift(1)) & (df['low'] < df['low'].shift(-1))]
        
        # Trend detection based on pivot points (simplified)
        df['is_hh'] = (df['pivot_high'] > df['pivot_high'].shift(1)).fillna(False)
        df['is_hl'] = (df['pivot_low'] > df['pivot_low'].shift(1)).fillna(False)
        df['trend_up'] = df['is_hh'] & df['is_hl']
        
        # Breakout detection
        df['resistance'] = df['high'].rolling(window=20).max().shift(1)
        df['breakout'] = df['close'] > df['resistance']
        
        return df

    def get_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = self.add_technical_indicators(df)
        df = self.add_candlestick_patterns(df)
        df = self.add_market_structure(df)
        return df.fillna(0)
