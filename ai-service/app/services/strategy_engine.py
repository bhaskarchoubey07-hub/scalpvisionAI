import random

class StrategyEngine:
    def __init__(self):
        pass

    def generate_strategy(self, data: dict, market: str, symbol: str, timeframe: str):
        """Generates a trading signal and key levels using technical rules."""
        if not data:
            return None

        trend = data.get("trend", "sideways")
        support = data.get("support_levels", [])
        resistance = data.get("resistance_levels", [])
        
        # Determine signal based on trend and breakout logic
        # (Very simplified for this mock demonstration to show use of OpenCV data)
        if trend == "uptrend":
            signal = "BUY"
            direction = "long"
            confidence = random.randint(70, 90)
        elif trend == "downtrend":
            signal = "SELL"
            direction = "short"
            confidence = random.randint(70, 90)
        else:
            signal = "HOLD"
            direction = "neutral"
            confidence = random.randint(40, 60)

        # Approximate price levels (since we only have pixel-based percentages)
        # We assume a mid-point or last price for entry
        # In a real app, you'd fetch the current price from an API.
        # Here we'll generate some realistic numbers based on common tickers.
        base_price = 65000.0 if market == "crypto" else 500.0
        
        # Relative movement scale
        scale = 0.05 # 5% movement max
        
        entry = base_price
        if direction == "long":
            stop_loss = base_price * (1 - scale * 0.4)
            take_profit = base_price * (1 + scale)
        elif direction == "short":
            stop_loss = base_price * (1 + scale * 0.4)
            take_profit = base_price * (1 - scale)
        else:
            stop_loss = base_price * 0.95
            take_profit = base_price * 1.05

        risk_reward = round((abs(take_profit - entry) / abs(entry - stop_loss)), 2) if entry != stop_loss else 0

        return {
            "signal": signal,
            "direction": direction,
            "entry_price": round(entry, 2),
            "stop_loss": round(stop_loss, 2),
            "take_profit": round(take_profit, 2),
            "risk_reward": risk_reward,
            "confidence": confidence,
            "trend": trend,
            "market": market,
            "symbol": symbol or ("BTC/USDT" if market == "crypto" else "SPY"),
            "timeframe": timeframe or "1h",
            "support": support,
            "resistance": resistance
        }

strategy_engine = StrategyEngine()
