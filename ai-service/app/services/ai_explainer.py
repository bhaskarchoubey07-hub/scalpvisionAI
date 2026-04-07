import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class AIExplainer:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.model = "llama-3-70b-8192"

    def explain_trade(self, strategy: dict):
        """Generates a human-like explanation using Groq or a fallback."""
        if not strategy:
            return "No analysis data available."

        # Template for AI prompt
        prompt = f"""
        You are an expert trading analyst. Explain this {strategy['market']} {strategy['direction']} trade setup.
        
        Data:
        - Symbol: {strategy['symbol']}
        - Timeframe: {strategy['timeframe']}
        - Signal: {strategy['signal']}
        - Trend: {strategy['trend']}
        - Entry: {strategy['entry_price']}
        - Stop Loss: {strategy['stop_loss']}
        - Take Profit: {strategy['take_profit']}
        - Risk/Reward: {strategy['risk_reward']}
        - Confidence: {strategy['confidence']}%
        
        Provide a 3-sentence technical reasoning that sounds professional and mentions the key levels and trend.
        DO NOT use markdown, just plain text.
        """

        # AI explanation with fallback
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=200
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Groq API error: {e}")
                return self._generate_fallback_explanation(strategy)
        else:
            return self._generate_fallback_explanation(strategy)

    def _generate_fallback_explanation(self, strategy: dict):
        """Rule-based explanation when API is unavailable."""
        trend = strategy['trend']
        signal = strategy['signal']
        dir_text = "bullish" if strategy['direction'] == "long" else "bearish"
        
        if signal == "HOLD":
            return f"The market for {strategy['symbol']} is currently in a sideways consolidation phase on the {strategy['timeframe']} timeframe. No clear edge is detected, and waiting for a breakout is recommended to avoid unnecessary risk."
        
        return f"A technical {dir_text} setup has been identified for {strategy['symbol']} following the detected {trend}. The current entry price at {strategy['entry_price']} offers a risk-to-reward ratio of {strategy['risk_reward']}, with primary targets set at {strategy['take_profit']}."

ai_explainer = AIExplainer()
