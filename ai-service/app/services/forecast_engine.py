import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from datetime import datetime, timedelta
from ..schemas import ForecastRequest, ForecastResponse, ForecastPointSimple
from .ai_explainer import ai_explainer

class ForecastEngine:
    def generate_5y_forecast(self, payload: ForecastRequest) -> ForecastResponse:
        """Generates a 5-year forecast based on historical data using Polynomial Regression."""
        if not payload.historical_data:
            return ForecastResponse(points=[], narrative="Insufficient data for forecasting.", confidence_score=0, trend="neutral")

        df = pd.DataFrame(payload.historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Convert dates to numerical values (days from start)
        start_date = df['date'].min()
        df['days'] = (df['date'] - start_date).dt.days
        
        x = df['days'].values
        y = df['price'].values
        
        # Fit a 3rd degree polynomial
        z = np.polyfit(x, y, 3)
        p = np.poly1d(z)
        
        # Sample historical points for speed (max 100)
        final_points = []
        step = max(1, len(df) // 100)
        for i in range(0, len(df), step):
            final_points.append(ForecastPointSimple(
                date=df['date'].iloc[i].strftime('%Y-%m-%d'),
                price=float(df['price'].iloc[i]),
                is_forecast=False
            ))
            
        # Generate forecast points (monthly for 5 years = 60 points)
        last_day = x[-1]
        last_date = df['date'].max()
        forecast_days = np.linspace(last_day, last_day + (payload.forecast_years * 365), 12 * payload.forecast_years)
        forecast_prices = p(forecast_days)
        
        # Floor prices at 20% of min historical to avoid negative projections
        floor = y.min() * 0.2
        
        for i, f_day in enumerate(forecast_days):
            if f_day <= last_day: continue
            
            f_date = last_date + timedelta(days=int(f_day - last_day))
            final_points.append(ForecastPointSimple(
                date=f_date.strftime('%Y-%m-%d'),
                price=float(max(floor, forecast_prices[i])),
                is_forecast=True
            ))

        # Determine trend
        start_f = forecast_prices[0]
        end_f = forecast_prices[-1]
        trend = "bullish" if end_f > start_f * 1.05 else "bearish" if end_f < start_f * 0.95 else "neutral"
        
        # Narrative via AI
        narrative = self._generate_narrative(payload.symbol, trend, float(start_f), float(end_f))
        
        return ForecastResponse(
            points=final_points,
            narrative=narrative,
            confidence_score=0.72,
            trend=trend
        )

    def _generate_narrative(self, symbol: str, trend: str, start_p: float, end_p: float) -> str:
        prompt = f"""
        Analyze this 5-year algorithmic price forecast for {symbol}.
        Trend: {trend.upper()}
        Basis: {start_p:.2f}
        5-Year Target: {end_p:.2f}
        
        Provide a professional market narrative (3-4 sentences). 
        Explain what factors generally drive this type of {trend} curve in the long term.
        Maintain a realistic, non-advisory tone. Do not use markdown.
        """
        
        if ai_explainer.client:
            try:
                response = ai_explainer.client.chat.completions.create(
                    model=ai_explainer.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=200
                )
                return response.choices[0].message.content.strip()
            except:
                pass
        return f"Historical analysis suggests a {trend} trajectory for {symbol} over the next 60 months based on polynomial trend projection."

forecast_engine = ForecastEngine()
