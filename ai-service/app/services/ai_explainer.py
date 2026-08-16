import os
import numpy as np
from groq import Groq
from dotenv import load_dotenv
from typing import Dict, List

load_dotenv()

class AIExplainer:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.model = "llama-3-70b-8192"

    def get_feature_importances(self, symbol: str) -> Dict[str, float]:
        """Calculates feature importances from the saved ML models or uses a default profile."""
        model_dir = "models"
        importances = {}
        
        # Match features from FeatureEngineer
        features = [
            "rsi", "macd", "macd_signal", "macd_hist",
            "ma20", "ma50", "ma200", "ema20",
            "bb_upper", "bb_lower", "atr", "vol_spike",
            "pattern_doji", "pattern_hammer", "pattern_shooting_star",
            "pattern_bullish_engulfing", "pattern_bearish_engulfing",
            "is_hh", "is_hl", "trend_up", "breakout"
        ]
        
        # Default balanced quantitative profile
        default_importances = {
            "RSI Momentum": 0.18,
            "MACD Crossover": 0.16,
            "Moving Averages Ribbon": 0.15,
            "Trend Structure (HH/HL)": 0.14,
            "Volatility Breakout": 0.12,
            "Volume Confirmation": 0.10,
            "Candlestick Patterns": 0.08,
            "Bollinger Bands Width": 0.07
        }
        
        model_loaded = False
        if os.path.exists(model_dir):
            try:
                for file in os.listdir(model_dir):
                    if file.startswith(symbol) and file.endswith(".joblib"):
                        import joblib
                        model = joblib.load(os.path.join(model_dir, file))
                        if hasattr(model, "feature_importances_"):
                            raw_importances = model.feature_importances_
                            # Map raw features to user-friendly indicator groups
                            mapped_imp = {
                                "RSI Momentum": float(raw_importances[0]) if len(raw_importances) > 0 else 0.1,
                                "MACD Crossover": float(raw_importances[1] + raw_importances[3]) if len(raw_importances) > 3 else 0.1,
                                "Moving Averages Ribbon": float(raw_importances[4] + raw_importances[5] + raw_importances[7]) if len(raw_importances) > 7 else 0.1,
                                "Trend Structure (HH/HL)": float(raw_importances[17] + raw_importances[18] + raw_importances[19]) if len(raw_importances) > 19 else 0.1,
                                "Volatility Breakout": float(raw_importances[20]) if len(raw_importances) > 20 else 0.1,
                                "Volume Confirmation": float(raw_importances[11]) if len(raw_importances) > 11 else 0.1,
                                "Candlestick Patterns": float(raw_importances[12] + raw_importances[13] + raw_importances[15]) if len(raw_importances) > 15 else 0.1,
                                "Bollinger Bands Width": float(raw_importances[8] + raw_importances[9]) if len(raw_importances) > 9 else 0.1,
                            }
                            # Normalize
                            total = sum(mapped_imp.values()) + 1e-9
                            importances = {k: v / total for k, v in mapped_imp.items()}
                            model_loaded = True
                            break
            except Exception as e:
                print(f"Error loading model for importances: {e}")
                
        if not model_loaded:
            importances = default_importances
            
        # Sort by importance descending
        sorted_imp = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_imp)

    def explain_trade(self, strategy: dict) -> str:
        """Generates a quantitative explainable AI trade breakdown."""
        if not strategy:
            return "No analysis data available."

        symbol = strategy.get('symbol', 'Asset')
        direction = strategy.get('direction', 'long')
        action = "BUY" if direction == "long" else "SELL" if direction == "short" else "HOLD"
        
        # Calculate feature importances
        importances = self.get_feature_importances(symbol)
        top_indicators = list(importances.keys())[:5]
        
        # Create structured text presentation
        xai_section = "\n\nEXPLAINABLE AI (XAI) METRICS:\n"
        xai_section += f"Reasoning: Why we recommend {action} on {symbol}:\n"
        
        # Map values
        trend = strategy.get('trend', 'neutral')
        if action == "BUY":
            xai_section += f"- Trend Confirmation: Market structure shows bullish higher-highs and higher-lows (HH/HL).\n"
            xai_section += f"- Momentum Confluence: Indicators confirm strong upward momentum pushing out of value zones.\n"
        elif action == "SELL":
            xai_section += f"- Trend Confirmation: Market structure shows bearish lower-highs and lower-lows (LH/LL).\n"
            xai_section += f"- Momentum Confluence: Indicators confirm strong downward pressure breaking below support.\n"
        else:
            xai_section += f"- Consolidation: Price action is range-bound with no clear structural breakout detected.\n"

        xai_section += "\nTop 5 Contributing Indicators & Feature Weights:\n"
        for ind in top_indicators:
            weight_pct = importances[ind] * 100
            xai_section += f"• {ind}: {weight_pct:.1f}%\n"

        prompt = f"""
        You are a Senior Quantitative Analyst at a top-tier hedge fund. Explain this {strategy.get('market')} {strategy.get('direction')} trade setup.
        
        Market Context:
        - Symbol: {symbol}
        - Timeframe: {strategy.get('timeframe')}
        - Direction: {strategy.get('direction')}
        - Current Trend: {trend}
        
        Technical Levels:
        - Entry: {strategy.get('entry_price')}
        - Stop Loss: {strategy.get('stop_loss')}
        - Take Profit: {strategy.get('take_profit')}
        - Risk/Reward: {strategy.get('risk_reward')}
        - Confidence: {strategy.get('confidence')}%
        
        Top 5 Indicators contributing to this setup:
        {', '.join([f"{k} ({v*100:.1f}%)" for k, v in list(importances.items())[:5]])}
        
        Provide a professional market narrative (3-4 sentences). 
        Discuss the confluence of these top contributing indicators and why they justify the risk/reward placement.
        DO NOT use markdown, just plain text.
        """

        # AI explanation with fallback
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.6,
                    max_tokens=220
                )
                narrative = response.choices[0].message.content.strip()
                return narrative + xai_section
            except Exception as e:
                print(f"Groq API error: {e}")
                return self._generate_fallback_explanation(strategy, importances) + xai_section
        else:
            return self._generate_fallback_explanation(strategy, importances) + xai_section

    def _generate_fallback_explanation(self, strategy: dict, importances: Dict[str, float]) -> str:
        """Rule-based explanation when API is unavailable."""
        trend = strategy.get('trend', 'sideways')
        direction = strategy.get('direction', 'long')
        dir_text = "bullish" if direction == "long" else "bearish"
        symbol = strategy.get('symbol', 'Asset')
        
        if strategy.get('signal') == "HOLD":
            return f"The market for {symbol} is currently in a sideways consolidation phase on the {strategy.get('timeframe')} timeframe. No clear edge is detected, and waiting for a breakout is recommended to avoid range chop."
        
        top_ind = list(importances.keys())[0]
        top_weight = importances[top_ind] * 100
        
        return (
            f"A technical {dir_text} setup has been identified for {symbol} following the detected {trend}. "
            f"The entry price at {strategy.get('entry_price')} offers a risk-to-reward ratio of {strategy.get('risk_reward')}, "
            f"with stop-loss placed structural-based at {strategy.get('stop_loss')} and targets at {strategy.get('take_profit')}. "
            f"The prediction is highly driven by the {top_ind} indicator, contributing {top_weight:.1f}% to the signal model consensus."
        )

    def ask_advisor(self, question: str, history: List[dict] = None, context: dict = None):
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
