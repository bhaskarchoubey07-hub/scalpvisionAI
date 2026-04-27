import sys
import os
import pandas as pd
from .data_pipeline import DataPipeline
from .features import FeatureEngineer
from .labeling import Labeler
from .trainer import ModelTrainer
from .backtester import Backtester

def test_pipeline():
    symbol = "RELIANCE.NS"
    timeframe = "1h"
    
    print(f"--- Starting ML Pipeline Test for {symbol} ---")
    
    dp = DataPipeline()
    fe = FeatureEngineer()
    labeler = Labeler()
    trainer = ModelTrainer()
    backtester = Backtester()
    
    # 1. Fetch Data
    print("Step 1: Fetching data...")
    df = dp.fetch_historical_data(symbol, timeframe, period="1y")
    print(f"Fetched {len(df)} rows.")
    
    # 2. Feature Engineering
    print("Step 2: Engineering features...")
    df_features = fe.get_features(df)
    print(f"Features generated: {df_features.columns.tolist()[:10]}...")
    
    # 3. Labeling
    print("Step 3: Labeling data...")
    df_labeled = labeler.label_data(df_features)
    print(f"Data labeled. Target distribution:\n{df_labeled['target'].value_counts()}")
    
    # 4. Training
    print("Step 4: Training XGBoost model...")
    X = df_labeled.drop(columns=['target', 'timestamp'])
    y = df_labeled['target']
    
    split = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]
    
    model = trainer.train_xgboost(X_train, y_train)
    metrics = trainer.validate(model, X_test, y_test)
    print(f"Training completed. Metrics: {metrics}")
    
    # 5. Backtesting
    print("Step 5: Running backtest on test set...")
    preds = model.predict(X_test)
    # We need the OHLCV data for the test set
    df_test_ohlcv = df.iloc[split + df_features.index[0] : len(df)] # Adjust for drops
    # For simplicity, just use the matching rows from df_labeled
    df_backtest = df.iloc[df_labeled.index[split:]]
    
    results = backtester.run_backtest(df_backtest, preds)
    print(f"Backtest results: {results}")
    
    # 6. Save Model
    print("Step 6: Saving model...")
    path = trainer.save_model(model, f"test_{symbol}")
    print(f"Model saved to {path}")
    
    print("--- Pipeline Test Completed Successfully ---")

if __name__ == "__main__":
    test_pipeline()
