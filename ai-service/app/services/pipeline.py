import os
from ..schemas import AnalyzeRequest, AnalyzeResponse, IndicatorReading
from .image_processor import image_processor
from .strategy_engine import strategy_engine
from .signal_enhancer import signal_enhancer
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
        request.timeframe,
        current_price=request.current_price,
        rsi=request.rsi,
        macd_bias=request.macd_bias
    )

    # 3. NEW: Smart Signal Enhancer Layer
    metadata = {
        "volume": request.volume,
        "avg_volume": request.avg_volume,
        "atr": request.atr,
        "volatility": request.volatility,
        "current_price": request.current_price,
        "trend": strategy.get("trend")
    }
    enhanced_strategy = signal_enhancer.enhance(strategy, metadata)

    # 4. AI Explanation (Groq) - Use enhanced signal for explanation
    explanation = ai_explainer.explain_trade(enhanced_strategy)

    # 5. Map to Output Schema
    indicators = []
    if enhanced_strategy.get("rsi") is not None:
        indicators.append(IndicatorReading(
            name="RSI", 
            value=f"{enhanced_strategy['rsi']:.1f}", 
            bias="bearish" if enhanced_strategy["rsi"] > 70 else ("bullish" if enhanced_strategy["rsi"] < 30 else "neutral")
        ))
    
    if enhanced_strategy.get("macd_bias"):
        indicators.append(IndicatorReading(
            name="MACD", 
            value=enhanced_strategy["macd_bias"].capitalize(), 
            bias=enhanced_strategy["macd_bias"]
        ))

    indicators.append(IndicatorReading(
        name="Trend", 
        value=enhanced_strategy["trend"].capitalize(), 
        bias="bullish" if enhanced_strategy["direction"] == "long" else ("bearish" if enhanced_strategy["direction"] == "short" else "neutral")
    ))

    return AnalyzeResponse(
        market=enhanced_strategy["market"],
        symbol=enhanced_strategy["symbol"],
        timeframe=enhanced_strategy["timeframe"],
        chart_type="candlestick",
        confidence=float(enhanced_strategy["confidence"]),
        entry_price=float(enhanced_strategy["entry_price"]),
        stop_loss=float(enhanced_strategy["stop_loss"]),
        take_profit=float(enhanced_strategy["take_profit"]),
        risk_reward=float(enhanced_strategy["risk_reward"]),
        direction="long" if enhanced_strategy["direction"] == "long" else "short",
        patterns=["Enhanced via Price Action Layer"],
        support_levels=[float(s) for s in enhanced_strategy["support"]],
        resistance_levels=[float(r) for r in enhanced_strategy["resistance"]],
        indicators=indicators,
        summary=explanation,
        # Enhanced fields
        refined_entry=float(enhanced_strategy["refined_entry"]),
        entry_zone=enhanced_strategy["entry_zone"],
        validity=enhanced_strategy["validity"],
        refinement_reason=enhanced_strategy["refinement_reason"]
    )
