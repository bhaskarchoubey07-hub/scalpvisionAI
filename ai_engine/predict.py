import joblib
import numpy as np
import os

FEATURES = [
    "return", "price_change", "volatility",
    "ma20", "ma50", "rsi",
    "macd", "macd_signal", "macd_hist",
    "bb_upper", "bb_lower", "bb_width"
]

def load_model(model_path="trading_model_ensemble.pkl"):
    try:
        if not os.path.exists(model_path):
            print(f"Model not found at {model_path}")
            return None
        return joblib.load(model_path)
    except Exception as e:
        print(f"Failed to load model {model_path}: {e}")
        return None

def predict_signal(model, latest_row: dict, min_conf=0.70):
    if not model:
        return {"signal": "NO_TRADE", "confidence": 0.0, "error": "Model not loaded"}
        
    try:
        # Safely extract features or default to 0.0
        x = np.array([[float(latest_row.get(f, 0.0)) for f in FEATURES]])
        
        # Probabilistic outputs
        probs = model.predict_proba(x)[0]
        pred = int(np.argmax(probs))
        conf = float(np.max(probs))
        
        # Risk control: only trade if confidence >= threshold
        if conf < min_conf:
            return {"signal": "NO_TRADE", "confidence": round(conf * 100, 2)}
            
        return {
            "signal": "BUY" if pred == 1 else "SELL",
            "confidence": round(conf * 100, 2)
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"signal": "NO_TRADE", "confidence": 0.0, "error": str(e)}
