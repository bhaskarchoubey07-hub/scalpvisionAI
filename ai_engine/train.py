import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report
import joblib
import os

def load_data(filepath: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(filepath)
        print(f"Data loaded successfully from {filepath}. Shape: {df.shape}")
        return df
    except Exception as e:
        print(f"Error loading data from {filepath}: {e}")
        return pd.DataFrame()

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    print("Engineering features...")
    data = df.copy()
    
    # Make sure we sort by date if date column exists
    if 'date' in data.columns:
        data['date'] = pd.to_datetime(data['date'])
        data = data.sort_values('date').reset_index(drop=True)
        
    # Base features
    data['return'] = data['close'].pct_change()
    data['price_change'] = data['close'] - data['open']
    data['volatility'] = data['return'].rolling(window=20).std()
    
    # MAs
    data['ma20'] = data['close'].rolling(window=20).mean()
    data['ma50'] = data['close'].rolling(window=50).mean()
    
    # RSI (14)
    delta = data['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    data['rsi'] = 100 - (100 / (1 + rs))
    
    # MACD (12,26,9)
    data["ema12"] = data["close"].ewm(span=12, adjust=False).mean()
    data["ema26"] = data["close"].ewm(span=26, adjust=False).mean()
    data["macd"] = data["ema12"] - data["ema26"]
    data["macd_signal"] = data["macd"].ewm(span=9, adjust=False).mean()
    data["macd_hist"] = data["macd"] - data["macd_signal"]
    
    # Bollinger Bands (20, 2σ)
    data["bb_ma"] = data["close"].rolling(window=20).mean()
    data["bb_std"] = data["close"].rolling(window=20).std()
    data["bb_upper"] = data["bb_ma"] + 2 * data["bb_std"]
    data["bb_lower"] = data["bb_ma"] - 2 * data["bb_std"]
    data["bb_width"] = (data["bb_upper"] - data["bb_lower"]) / data["bb_ma"]
    
    # Clean NaNs created by rolling windows
    data = data.dropna().reset_index(drop=True)
    return data

def create_labels(df: pd.DataFrame, threshold: float = 0.001) -> pd.DataFrame:
    print("Creating labels...")
    data = df.copy()
    data['future_close'] = data['close'].shift(-1)
    
    # Binary label: 1 if future_close > close by threshold (e.g. 0.1%), else 0
    data['label'] = np.where((data['future_close'] - data['close']) / data['close'] > threshold, 1, 0)
    
    data = data.dropna().reset_index(drop=True)
    return data

def train_ensemble_model(data: pd.DataFrame):
    features = [
        "return", "price_change", "volatility",
        "ma20", "ma50", "rsi",
        "macd", "macd_signal", "macd_hist",
        "bb_upper", "bb_lower", "bb_width"
    ]
    
    X = data[features]
    y = data["label"]
    
    # Class balance report
    print("\n--- Class Balance ---")
    print(y.value_counts(normalize=True))
    print("---------------------\n")
    
    # Time-based split (80/20) - NO random shuffling to avoid data leakage
    split = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]
    
    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    # Models
    rf = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=42
    )
    
    # Ensemble (VotingClassifier with soft voting for probabilities)
    ensemble = VotingClassifier(
        estimators=[("rf", rf), ("xgb", xgb)],
        voting="soft"
    )
    
    print("Training Ensemble model...")
    ensemble.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = ensemble.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    model_path = "trading_model_ensemble.pkl"
    joblib.dump(ensemble, model_path)
    print(f"Model saved to {model_path}")
    return ensemble, model_path

if __name__ == "__main__":
    filepath = "../cleaned_stock_data.csv"
    if not os.path.exists(filepath):
        filepath = "cleaned_stock_data.csv"
        
    df = load_data(filepath)
    if not df.empty:
        # Sample for faster training in local environment
        if len(df) > 50000:
            print(f"Sampling 50000 rows out of {len(df)} for faster training...")
            df = df.sample(50000, random_state=42).sort_values('date').reset_index(drop=True)
            
        df_features = engineer_features(df)
        df_labeled = create_labels(df_features, threshold=0.001) # 0.1% increase threshold
        train_ensemble_model(df_labeled)
    else:
        print("Dataset not found. Please place 'cleaned_stock_data.csv' in the working directory.")
