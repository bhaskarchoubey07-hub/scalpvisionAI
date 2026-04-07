import random

class StrategyEngine:
    def __init__(self):
        pass

    def generate_strategy(self, data: dict, market: str, symbol: str, timeframe: str, current_price: float = None, rsi: float = None, macd_bias: str = None):
        """Generates a trading signal and key levels using technical rules."""
        if not data:
            return None

        trend = data.get("trend", "sideways")
        support = data.get("support_levels", [])
        resistance = data.get("resistance_levels", [])
        
        # 1. Base Direction from Trend
        direction = "neutral"
        if trend == "uptrend":
            direction = "long"
        elif trend == "downtrend":
            direction = "short"

        # 2. Logic refinement using RSI and MACD
        confidence = 50
        if direction == "long":
            confidence = 60
            if rsi is not None:
                if rsi < 30: # Oversold in uptrend = Strong Buy
                    confidence += 20
                elif rsi > 70: # Overbought in uptrend = Caution
                    confidence -= 10
            if macd_bias == "bullish":
                confidence += 10
        elif direction == "short":
            confidence = 60
            if rsi is not None:
                if rsi > 70: # Overbought in downtrend = Strong Sell
                    confidence += 20
                elif rsi < 30: # Oversold in downtrend = Caution
                    confidence -= 10
            if macd_bias == "bearish":
                confidence += 10
        
        signal = "HOLD"
        if confidence >= 70:
            signal = "BUY" if direction == "long" else "SELL"
        elif confidence >= 50 and direction != "neutral":
            signal = "WATCH"

        # 3. Price mapping for OpenCV levels (relative 0-100% height)
        # We assume the current price is somewhere near the middle of the chart if we don't have better data.
        # But for now, we'll just map the 0-100 scale to a +/- 10% range around the entry price.
        # This makes the "detected" levels look like they belong to the price chart.
        entry = current_price or (65000.0 if market == "crypto" else 500.0)
        
        def map_to_price(p_level):
            # p_level is 0-100. Let's say 50 is center (current price)
            # 100 is top, 0 is bottom.
            # Range is +/- 5% from entry
            offset_pct = (p_level - 50) / 100 * 0.1 # +/- 5%
            return round(entry * (1 + offset_pct), 2)

        real_support = [map_to_price(s) for s in support]
        real_resistance = [map_to_price(r) for r in resistance]

        # 4. Price Levels for Signal
        # Relative movement scale based on timeframe
        tf_scales = {"1m": 0.005, "5m": 0.01, "15m": 0.02, "1h": 0.04, "4h": 0.08, "1d": 0.15}
        scale = tf_scales.get(timeframe, 0.03)
        
        if direction == "long":
            stop_loss = entry * (1 - scale * 0.5)
            take_profit = entry * (1 + scale)
        elif direction == "short":
            stop_loss = entry * (1 + scale * 0.5)
            take_profit = entry * (1 - scale)
        else:
            stop_loss = entry * 0.98
            take_profit = entry * 1.02

        risk_reward = round((abs(take_profit - entry) / abs(entry - stop_loss)), 2) if entry != stop_loss else 0

        return {
            "signal": signal,
            "direction": direction,
            "entry_price": round(entry, 2),
            "stop_loss": round(stop_loss, 2),
            "take_profit": round(take_profit, 2),
            "risk_reward": risk_reward,
            "confidence": min(confidence, 99),
            "trend": trend,
            "market": market,
            "symbol": symbol or ("BTC/USDT" if market == "crypto" else "SPY"),
            "timeframe": timeframe or "1h",
            "support": real_support,
            "resistance": real_resistance,
            "rsi": rsi,
            "macd_bias": macd_bias
        }

strategy_engine = StrategyEngine()
