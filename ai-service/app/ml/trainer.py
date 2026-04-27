import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, precision_score, recall_score
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import joblib
import os
from typing import Dict, Any

class ModelTrainer:
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)

    def train_xgboost(self, X_train: pd.DataFrame, y_train: pd.Series) -> xgb.XGBClassifier:
        model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            objective='multi:softprob',
            num_class=3
        )
        model.fit(X_train, y_train)
        return model

    def train_random_forest(self, X_train: pd.DataFrame, y_train: pd.Series) -> RandomForestClassifier:
        model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        model.fit(X_train, y_train)
        return model

    def train_lstm(self, X_train: np.ndarray, y_train: np.ndarray, input_shape: tuple) -> Sequential:
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(3, activation='softmax') # BUY, SELL, HOLD
        ])
        model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
        model.fit(X_train, y_train, epochs=10, batch_size=32, verbose=0)
        return model

    def validate(self, model: Any, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        preds = model.predict(X_test)
        return {
            "accuracy": accuracy_score(y_test, preds),
            "precision": precision_score(y_test, preds, average='weighted'),
            "recall": recall_score(y_test, preds, average='weighted')
        }

    def walk_forward_validation(self, df: pd.DataFrame, model_type: str = 'xgboost'):
        """
        Perform walk-forward validation on time-series data.
        """
        tscv = TimeSeriesSplit(n_splits=5)
        X = df.drop(columns=['target', 'timestamp'])
        y = df['target']
        
        results = []
        for train_index, test_index in tscv.split(X):
            X_train, X_test = X.iloc[train_index], X.iloc[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]
            
            if model_type == 'xgboost':
                model = self.train_xgboost(X_train, y_train)
            elif model_type == 'rf':
                model = self.train_random_forest(X_train, y_train)
            else:
                continue
                
            metrics = self.validate(model, X_test, y_test)
            results.append(metrics)
            
        return results

    def save_model(self, model: Any, name: str):
        path = os.path.join(self.model_dir, f"{name}.joblib")
        joblib.dump(model, path)
        return path

    def load_model(self, name: str):
        path = os.path.join(self.model_dir, f"{name}.joblib")
        return joblib.load(path)
