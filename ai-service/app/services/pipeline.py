import os
from ..schemas import AnalyzeRequest, AnalyzeResponse, IndicatorReading
from .image_processor import image_processor
from .strategy_engine import strategy_engine
from .ai_explainer import ai_explainer

def run_analysis_pipeline(request: AnalyzeRequest) -> AnalyzeResponse:
    """The main entry point for AI analysis of charts and tickers."""
    
    # 1. Processing (Image or Ticker only)
    if request.image_url and str(request.image_url).startswith("http"):
        img = image_processor.load_image(str(request.image_url))
        cv_data = image_processor.analyze_chart(img)
    else:
        # Fallback for ticker-only analysis (No image provided)
        cv_data = {
            "trend": "unknown (no image)",
            "support_levels": [],
            "resistance_levels": [],
        }

    # 2. Strategy Engine
    strategy = strategy_engine.generate_strategy(
        cv_data, 
        request.market, 
        request.symbol, 
        request.timeframe
    )

    # 3. AI Explanation (Groq)
    explanation = ai_explainer.explain_trade(strategy)

    # 4. Map to Output Schema
    # Mocking indicators for now as requested (could be expanded)
    indicators = [
        IndicatorReading(name="RSI", value="Approx 55", bias="neutral"),
        IndicatorReading(name="Trend", value=strategy["trend"], bias="bullish" if strategy["direction"] == "long" else "bearish"),
    ]

    return AnalyzeResponse(
        market=strategy["market"],
        symbol=strategy["symbol"],
        timeframe=strategy["timeframe"],
        chart_type="candlestick",
        confidence=float(strategy["confidence"]),
        entry_price=float(strategy["entry_price"]),
        stop_loss=float(strategy["stop_loss"]),
        take_profit=float(strategy["take_profit"]),
        risk_reward=float(strategy["risk_reward"]),
        direction="long" if strategy["direction"] == "long" else "short",
        patterns=["Detected via OpenCV"],
        support_levels=[float(s) for s in strategy["support"]],
        resistance_levels=[float(r) for r in strategy["resistance"]],
        indicators=indicators,
        summary=explanation
    )
