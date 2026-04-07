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
        You are a Senior Quantitative Analyst at a top-tier hedge fund. Explain this {strategy['market']} {strategy['direction']} trade setup.
        
        Market Context:
        - Symbol: {strategy['symbol']}
        - Timeframe: {strategy['timeframe']}
        - Direction: {strategy['direction']}
        - Current Trend: {strategy['trend']}
        
        Technical Indicators:
        - Price: {strategy['entry_price']}
        - RSI: {strategy.get('rsi', 'N/A')}
        - MACD Bias: {strategy.get('macd_bias', 'N/A')}
        
        Trade Parameters:
        - Entry: {strategy['entry_price']}
        - Stop Loss: {strategy['stop_loss']}
        - Take Profit: {strategy['take_profit']}
        - Risk/Reward: {strategy['risk_reward']}
        - Confidence: {strategy['confidence']}%
        
        Provide a professional market narrative (4-5 sentences). 
        Explain the CONFLUENCE (how the trend and indicators align or conflict).
        Mention specific technical levels and the logical reasoning behind the risk/reward setup.
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

    def ask_advisor(self, question: str, history: list = None, context: dict = None):
        """Answers general trading knowledge questions with high professional standards."""
        if not self.client:
            return "AI Advisor is currently in offline mode. Please ensure GROQ_API_KEY is configured."

        system_prompt = """
        You are the ScalpVision AI Advisor, a world-class professional trading mentor and market analyst.
        Your goal is to provide precise, educational, and punchy advice on trading concepts, strategies, and technical analysis.
        
        Rules:
        1. If asked about a concept (e.g., 'What is RSI?'), provide a clear high-level definition and ONE practical tip for using it in scalping.
        2. Always maintain a professional, confident, yet realistic tone (acknowledge market risks).
        3. If the user asks about a specific trade context provided, analyze it logically based on technical principles.
        4. Keep responses under 150 words.
        5. DO NOT provide financial advice; always add a brief 'Trade responsibly' disclaimer at the end.
        """

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history)
        
        user_content = f"Question: {question}"
        if context:
            user_content += f"\n\nCurrent Market Context: {context}"
            
        messages.append({"role": "user", "content": user_content})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.6,
                max_tokens=300
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Advisor API error: {e}")
            return "I'm having trouble connecting to my knowledge base. Let's try again in a moment."

ai_explainer = AIExplainer()
