import os
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from typing import List, Optional
from .utils import get_db_client, get_pg_conn

class DataPipeline:
    def __init__(self):
        self.db = get_db_client()

    def fetch_historical_data(self, symbol: str, timeframe: str, period: str = "2y") -> pd.DataFrame:
        """
        Fetch historical data from Yahoo Finance.
        Timeframes: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        """
        interval = timeframe
        if timeframe == "1h":
            interval = "1h"
        elif timeframe == "daily":
            interval = "1d"
        
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            raise ValueError(f"No data found for symbol {symbol}")
            
        df.reset_index(inplace=True)
        df.rename(columns={
            "Date": "timestamp",
            "Datetime": "timestamp",
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Volume": "volume"
        }, inplace=True)
        
        return df

    def sync_to_db(self, symbol: str, timeframe: str, df: pd.DataFrame):
        """
        Sync OHLCV data to Supabase ohlcv_data table.
        """
        conn = get_pg_conn()
        cur = conn.cursor()
        
        for index, row in df.iterrows():
            try:
                cur.execute(
                    """
                    INSERT INTO ohlcv_data (symbol, timeframe, open, high, low, close, volume, timestamp)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (symbol, timeframe, timestamp) DO NOTHING
                    """,
                    (symbol, timeframe, row['open'], row['high'], row['low'], row['close'], row['volume'], row['timestamp'])
                )
            except Exception as e:
                print(f"Error inserting row: {e}")
                continue
                
        conn.commit()
        cur.close()
        conn.close()

    def get_latest_candles(self, symbol: str, timeframe: str, limit: int = 500) -> pd.DataFrame:
        """
        Fetch latest candles from database.
        """
        conn = get_pg_conn()
        query = f"""
            SELECT open, high, low, close, volume, timestamp 
            FROM ohlcv_data 
            WHERE symbol = %s AND timeframe = %s 
            ORDER BY timestamp DESC 
            LIMIT %s
        """
        df = pd.read_sql(query, conn, params=(symbol, timeframe, limit))
        conn.close()
        return df.sort_values('timestamp')
