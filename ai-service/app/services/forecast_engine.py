import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Literal, Dict, Tuple
from ..schemas import ForecastRequest, ForecastResponse, ForecastPointSimple
from .ai_explainer import ai_explainer

# Disable logging spam from Prophet
import logging
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)

# --- NumPy LSTM & GRU Implementations (immune to DLL errors) ---
class NumPyLSTM:
    def __init__(self, input_dim=1, hidden_dim=4, output_dim=1):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim
        limit = np.sqrt(6 / (input_dim + hidden_dim))
        self.W_f = np.random.uniform(-limit, limit, (hidden_dim, input_dim + hidden_dim))
        self.W_i = np.random.uniform(-limit, limit, (hidden_dim, input_dim + hidden_dim))
        self.W_c = np.random.uniform(-limit, limit, (hidden_dim, input_dim + hidden_dim))
        self.W_o = np.random.uniform(-limit, limit, (hidden_dim, input_dim + hidden_dim))
        self.b_f = np.zeros((hidden_dim, 1))
        self.b_i = np.zeros((hidden_dim, 1))
        self.b_c = np.zeros((hidden_dim, 1))
        self.b_o = np.zeros((hidden_dim, 1))
        self.W_y = np.random.uniform(-limit, limit, (output_dim, hidden_dim))
        self.b_y = np.zeros((output_dim, 1))

    def _sigmoid(self, x):
        return 1 / (1 + np.exp(-np.clip(x, -50, 50)))

    def forward(self, X_seq):
        h = np.zeros((self.hidden_dim, 1))
        c = np.zeros((self.hidden_dim, 1))
        for xt in X_seq:
            xt = xt.reshape(-1, 1)
            concat = np.vstack((xt, h))
            ft = self._sigmoid(np.dot(self.W_f, concat) + self.b_f)
            it = self._sigmoid(np.dot(self.W_i, concat) + self.b_i)
            c_tilde = np.tanh(np.dot(self.W_c, concat) + self.b_c)
            c = ft * c + it * c_tilde
            ot = self._sigmoid(np.dot(self.W_o, concat) + self.b_o)
            h = ot * np.tanh(c)
        y = np.dot(self.W_y, h) + self.b_y
        return y[0, 0], h, c

class NumPyGRU:
    def __init__(self, input_dim=1, hidden_dim=4, output_dim=1):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim
        limit = np.sqrt(6 / (input_dim + hidden_dim))
        self.W_z = np.random.uniform(-limit, limit, (hidden_dim, input_dim + hidden_dim))
        self.W_r = np.random.uniform(-limit, limit, (hidden_dim, input_dim + hidden_dim))
        self.W_h = np.random.uniform(-limit, limit, (hidden_dim, input_dim + hidden_dim))
        self.b_z = np.zeros((hidden_dim, 1))
        self.b_r = np.zeros((hidden_dim, 1))
        self.b_h = np.zeros((hidden_dim, 1))
        self.W_y = np.random.uniform(-limit, limit, (output_dim, hidden_dim))
        self.b_y = np.zeros((output_dim, 1))

    def _sigmoid(self, x):
        return 1 / (1 + np.exp(-np.clip(x, -50, 50)))

    def forward(self, X_seq):
        h = np.zeros((self.hidden_dim, 1))
        for xt in X_seq:
            xt = xt.reshape(-1, 1)
            concat = np.vstack((xt, h))
            zt = self._sigmoid(np.dot(self.W_z, concat) + self.b_z)
            rt = self._sigmoid(np.dot(self.W_r, concat) + self.b_r)
            concat_r = np.vstack((xt, rt * h))
            h_tilde = np.tanh(np.dot(self.W_h, concat_r) + self.b_h)
            h = (1 - zt) * h + zt * h_tilde
        y = np.dot(self.W_y, h) + self.b_y
        return y[0, 0], h

def train_numpy_model(model, X_train, y_train, epochs=20, lr=0.1):
    if isinstance(model, NumPyLSTM):
        param_names = ['W_f', 'W_i', 'W_c', 'W_o', 'b_f', 'b_i', 'b_c', 'b_o', 'W_y', 'b_y']
    else:
        param_names = ['W_z', 'W_r', 'W_h', 'b_z', 'b_r', 'b_h', 'W_y', 'b_y']
        
    def get_loss():
        loss = 0.0
        for x, target in zip(X_train, y_train):
            pred = model.forward(x)[0]
            loss += (pred - target) ** 2
        return loss / len(X_train)

    for epoch in range(epochs):
        for name in param_names:
            arr = getattr(model, name)
            grad = np.zeros_like(arr)
            h = 1e-5
            it = np.nditer(arr, flags=['multi_index'], op_flags=['readwrite'])
            while not it.finished:
                idx = it.multi_index
                old_val = arr[idx]
                arr[idx] = old_val + h
                loss_plus = get_loss()
                arr[idx] = old_val - h
                loss_minus = get_loss()
                arr[idx] = old_val
                grad[idx] = (loss_plus - loss_minus) / (2 * h)
                it.iternext()
            arr -= lr * np.clip(grad, -1.0, 1.0)

# --- Forecasting Engine ---
class ForecastEngine:
    def generate_5y_forecast(self, payload: ForecastRequest) -> ForecastResponse:
        """Generates a 5-year forecast based on historical data using an ensemble of models."""
        if not payload.historical_data or len(payload.historical_data) < 10:
            return ForecastResponse(
                points=[], 
                narrative="Insufficient data for forecasting.", 
                confidence_score=0.0, 
                trend="neutral"
            )

        # 1. Parse and Resample Data to Monthly end
        df = pd.DataFrame(payload.historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').set_index('date')
        
        # Calculate daily returns volatility before resampling
        daily_returns = df['price'].pct_change().dropna()
        volatility = daily_returns.std() if len(daily_returns) > 1 else 0.02
        
        # Resample to monthly end (matching the monthly forecast steps)
        df_monthly = df.resample('ME').mean()
        df_monthly = df_monthly.dropna().reset_index()
        
        # If resampling left too few points, fallback to weekly/original scale
        if len(df_monthly) < 10:
            df_monthly = df.reset_index()
            freq_label = 'W'
        else:
            freq_label = 'ME'

        dates_h = df_monthly['date'].dt.strftime('%Y-%m-%d').tolist()
        prices_h = df_monthly['price'].values.astype(float)
        
        n_lags = min(4, len(prices_h) // 3)
        steps = 12 * payload.forecast_years # 60 steps

        # 2. Split for validation (80% train, 20% validation)
        split_idx = int(len(prices_h) * 0.8)
        train_prices = prices_h[:split_idx]
        val_prices = prices_h[split_idx:]
        
        # Setup model forecasts dict
        forecasts: Dict[str, List[float]] = {}
        mape_scores: Dict[str, float] = {}

        # Pre-prepare lag data for XGB, LGBM, CatBoost, RNNs
        X_train, y_train = self._prepare_lags(train_prices, n_lags)
        X_all, y_all = self._prepare_lags(prices_h, n_lags) # includes all for sequence roll-forward
        
        # --- Model 1: XGBoost ---
        try:
            import xgboost as xgb
            model_xgb = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
            model_xgb.fit(X_train, y_train)
            
            # Validation evaluation
            val_preds = []
            for i in range(split_idx, len(prices_h)):
                val_preds.append(model_xgb.predict(prices_h[i-n_lags:i].reshape(1, -1))[0])
            mape_scores["XGBoost"] = self._calculate_mape(val_prices, np.array(val_preds))
            
            # Fit all and forecast
            X_all, y_all = self._prepare_lags(prices_h, n_lags)
            model_xgb.fit(X_all, y_all)
            forecasts["XGBoost"] = self._forecast_autoregressive(model_xgb, prices_h[-n_lags:], steps)
        except Exception as e:
            print(f"XGBoost forecasting failed: {e}")

        # --- Model 2: LightGBM ---
        try:
            import lightgbm as lgb
            model_lgb = lgb.LGBMRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42, verbose=-1)
            model_lgb.fit(X_train, y_train)
            
            val_preds = []
            for i in range(split_idx, len(prices_h)):
                val_preds.append(model_lgb.predict(prices_h[i-n_lags:i].reshape(1, -1))[0])
            mape_scores["LightGBM"] = self._calculate_mape(val_prices, np.array(val_preds))
            
            model_lgb.fit(X_all, y_all)
            forecasts["LightGBM"] = self._forecast_autoregressive(model_lgb, prices_h[-n_lags:], steps)
        except Exception as e:
            print(f"LightGBM forecasting failed: {e}")

        # --- Model 3: CatBoost ---
        try:
            from catboost import CatBoostRegressor
            model_cb = CatBoostRegressor(iterations=50, depth=3, learning_rate=0.1, random_seed=42, verbose=0)
            model_cb.fit(X_train, y_train)
            
            val_preds = []
            for i in range(split_idx, len(prices_h)):
                val_preds.append(model_cb.predict(prices_h[i-n_lags:i].reshape(1, -1))[0])
            mape_scores["CatBoost"] = self._calculate_mape(val_prices, np.array(val_preds))
            
            model_cb.fit(X_all, y_all)
            forecasts["CatBoost"] = self._forecast_autoregressive(model_cb, prices_h[-n_lags:], steps)
        except Exception as e:
            print(f"CatBoost forecasting failed: {e}")

        # --- Model 4: Prophet ---
        try:
            from prophet import Prophet
            # Evaluate on validation split
            df_train = pd.DataFrame({"ds": df_monthly['date'].iloc[:split_idx], "y": train_prices})
            m_val = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
            m_val.fit(df_train)
            future_val = m_val.make_future_dataframe(periods=len(val_prices), freq=freq_label)
            val_forecast = m_val.predict(future_val)
            val_preds = val_forecast['yhat'].iloc[-len(val_prices):].values
            mape_scores["Prophet"] = self._calculate_mape(val_prices, val_preds)
            
            # Fit all and forecast
            df_all = pd.DataFrame({"ds": df_monthly['date'], "y": prices_h})
            m_all = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
            m_all.fit(df_all)
            future_all = m_all.make_future_dataframe(periods=steps, freq=freq_label)
            forecast_all = m_all.predict(future_all)
            forecasts["Prophet"] = forecast_all['yhat'].iloc[-steps:].values.tolist()
        except Exception as e:
            print(f"Prophet forecasting failed: {e}")

        # --- Model 5: LSTM ---
        try:
            # Scaler
            min_val, max_val = train_prices.min(), train_prices.max()
            rng = max_val - min_val if max_val != min_val else 1.0
            
            X_train_sc = (X_train - min_val) / rng
            y_train_sc = (y_train - min_val) / rng
            X_all_sc = (X_all - min_val) / rng
            y_all_sc = (y_all - min_val) / rng
            
            model_lstm = NumPyLSTM(input_dim=1, hidden_dim=4, output_dim=1)
            train_numpy_model(model_lstm, X_train_sc, y_train_sc, epochs=20, lr=0.1)
            
            val_preds = []
            for i in range(split_idx, len(prices_h)):
                seq = (prices_h[i-n_lags:i] - min_val) / rng
                val_preds.append(model_lstm.forward(seq)[0] * rng + min_val)
            mape_scores["LSTM"] = self._calculate_mape(val_prices, np.array(val_preds))
            
            # Train on all
            model_lstm_all = NumPyLSTM(input_dim=1, hidden_dim=4, output_dim=1)
            train_numpy_model(model_lstm_all, X_all_sc, y_all_sc, epochs=20, lr=0.1)
            forecasts["LSTM"] = self._forecast_numpy_rnn(model_lstm_all, prices_h[-n_lags:], steps, min_val, rng)
        except Exception as e:
            print(f"LSTM forecasting failed: {e}")

        # --- Model 6: GRU ---
        try:
            model_gru = NumPyGRU(input_dim=1, hidden_dim=4, output_dim=1)
            train_numpy_model(model_gru, X_train_sc, y_train_sc, epochs=20, lr=0.1)
            
            val_preds = []
            for i in range(split_idx, len(prices_h)):
                seq = (prices_h[i-n_lags:i] - min_val) / rng
                val_preds.append(model_gru.forward(seq)[0] * rng + min_val)
            mape_scores["GRU"] = self._calculate_mape(val_prices, np.array(val_preds))
            
            model_gru_all = NumPyGRU(input_dim=1, hidden_dim=4, output_dim=1)
            train_numpy_model(model_gru_all, X_all_sc, y_all_sc, epochs=20, lr=0.1)
            forecasts["GRU"] = self._forecast_numpy_rnn(model_gru_all, prices_h[-n_lags:], steps, min_val, rng)
        except Exception as e:
            print(f"GRU forecasting failed: {e}")

        # --- Fallback Fit (Polynomial) ---
        x_all_poly = np.arange(len(prices_h))
        z = np.polyfit(x_all_poly, prices_h, 3)
        p = np.poly1d(z)
        poly_forecast = p(np.arange(len(prices_h), len(prices_h) + steps)).tolist()

        # 3. Calculate Ensemble Weights based on Validation MAPE
        valid_models = [m for m in forecasts.keys() if m in mape_scores]
        if not valid_models:
            ensemble_forecast = poly_forecast
            confidence_score = 0.50
            weights = {}
        else:
            eps = 1e-4
            inv_mapes = {m: 1.0 / (mape_scores[m] + eps) for m in valid_models}
            sum_inv = sum(inv_mapes.values())
            weights = {m: inv_mapes[m] / sum_inv for m in valid_models}
            
            ensemble_forecast = np.zeros(steps)
            for m in valid_models:
                ensemble_forecast += np.array(forecasts[m]) * weights[m]
            ensemble_forecast = ensemble_forecast.tolist()

            # --- Calculate Dynamic Confidence Score ---
            final_prices = [forecasts[m][-1] for m in valid_models]
            final_mean = np.mean(final_prices) if final_prices else prices_h[-1]
            final_std = np.std(final_prices) if len(final_prices) > 1 else 0.0
            agreement_ratio = final_std / final_mean if final_mean > 0 else 0.05
            
            agreement_score = 1.0 * np.exp(-3.0 * agreement_ratio)
            accuracy_score = 1.0 * np.exp(-1.5 * np.mean([mape_scores[m] for m in valid_models]))
            volatility_penalty = 0.15 * min(1.0, volatility * 5)
            
            confidence_score = (0.5 * agreement_score) + (0.5 * accuracy_score) - volatility_penalty
            confidence_score = max(0.30, min(0.98, confidence_score))

        # 4. Format Output Points
        final_points = []
        
        step_h = max(1, len(df_monthly) // 120)
        for i in range(0, len(df_monthly), step_h):
            final_points.append(ForecastPointSimple(
                date=dates_h[i],
                price=float(prices_h[i]),
                is_forecast=False
            ))
            
        last_date = df_monthly['date'].max()
        floor_price = prices_h.min() * 0.15
        
        for i in range(steps):
            f_date = last_date + timedelta(days=int((i + 1) * 30.4))
            final_points.append(ForecastPointSimple(
                date=f_date.strftime('%Y-%m-%d'),
                price=float(max(floor_price, ensemble_forecast[i])),
                is_forecast=True
            ))

        start_f = prices_h[-1]
        end_f = ensemble_forecast[-1]
        trend = "bullish" if end_f > start_f * 1.05 else "bearish" if end_f < start_f * 0.95 else "neutral"

        narrative = self._generate_narrative(
            payload.symbol, 
            trend, 
            float(start_f), 
            float(end_f), 
            weights, 
            mape_scores,
            confidence_score
        )
        
        return ForecastResponse(
            points=final_points,
            narrative=narrative,
            confidence_score=round(confidence_score, 4),
            trend=trend
        )

    def _prepare_lags(self, prices: np.ndarray, n_lags: int) -> Tuple[np.ndarray, np.ndarray]:
        X, y = [], []
        for i in range(len(prices) - n_lags):
            X.append(prices[i : i + n_lags])
            y.append(prices[i + n_lags])
        return np.array(X), np.array(y)

    def _forecast_autoregressive(self, model, last_sequence: np.ndarray, steps: int) -> List[float]:
        predictions = []
        current_seq = list(last_sequence)
        n_lags = len(last_sequence)
        for _ in range(steps):
            x_input = np.array(current_seq[-n_lags:]).reshape(1, -1)
            pred = float(model.predict(x_input)[0])
            predictions.append(pred)
            current_seq.append(pred)
        return predictions

    def _forecast_numpy_rnn(self, model, last_sequence: np.ndarray, steps: int, min_val: float, rng: float) -> List[float]:
        predictions = []
        current_seq = ((last_sequence - min_val) / rng).tolist()
        n_lags = len(last_sequence)
        for _ in range(steps):
            seq_np = np.array(current_seq[-n_lags:])
            pred_scaled = model.forward(seq_np)[0]
            pred = pred_scaled * rng + min_val
            predictions.append(pred)
            current_seq.append(pred_scaled)
        return predictions

    def _calculate_mape(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
        return float(np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))))

    def _generate_narrative(self, symbol: str, trend: str, start_p: float, end_p: float, weights: Dict[str, float], mape: Dict[str, float], confidence: float) -> str:
        ensemble_text = ", ".join([f"{m} ({w*100:.1f}% weight)" for m, w in weights.items()])
        mape_text = ", ".join([f"{m} error: {err*100:.1f}%" for m, err in mape.items()])
        
        prompt = f"""
        Analyze this 5-year ensemble algorithmic price forecast for {symbol}.
        Trend Direction: {trend.upper()}
        Current Price: {start_p:.2f}
        5-Year Projected Price Target: {end_p:.2f}
        Ensemble Allocation Details: {ensemble_text}
        Validation Performance Metrics: {mape_text}
        Overall Model Consensus Confidence: {confidence*100:.2f}%
        
        Provide a professional market narrative (3-4 sentences). 
        Discuss what the voting models suggest regarding long-term trend stability.
        Maintain a realistic, quantitative, non-advisory tone. Do not use markdown.
        """
        
        if ai_explainer.client:
            try:
                response = ai_explainer.client.chat.completions.create(
                    model=ai_explainer.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=250
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Narrative generation failed: {e}")
                
        weight_desc = f"a weighted ensemble combining {', '.join(weights.keys())}" if weights else "a polynomial trend model"
        change_pct = ((end_p - start_p) / start_p) * 100
        return (
            f"Ensemble models project a {trend} outlook for {symbol} over the next 5 years, estimating a price change of "
            f"{change_pct:+.1f}% from the current level of {start_p:.2f} to {end_p:.2f}. This forecast is derived from "
            f"{weight_desc} optimized via walk-forward validation (consensus confidence: {confidence*100:.1f}%). "
            f"Tree regressors analyze momentum structure, while recurrent models model sequential dependencies to formulate this consensus target."
        )

forecast_engine = ForecastEngine()
