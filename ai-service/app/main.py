from fastapi import FastAPI

from .schemas import (
    AnalyzeRequest, AnalyzeResponse, 
    AdvisorRequest, AdvisorResponse, 
    ForecastRequest, ForecastResponse,
    ExplainRequest, ExplainResponse,
    EnhanceRequest, EnhanceResponse
)
from .services.pipeline import run_analysis_pipeline
from .services.ai_explainer import ai_explainer
from .services.forecast_engine import forecast_engine
from .services.signal_enhancer import signal_enhancer

app = FastAPI(title="ScalpVision AI Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "ai-engine"}


@app.post("/analyze-chart", response_model=AnalyzeResponse)
def analyze_chart(payload: AnalyzeRequest):
    return run_analysis_pipeline(payload)


@app.post("/advice", response_model=AdvisorResponse)
def get_advice(payload: AdvisorRequest):
    answer = ai_explainer.ask_advisor(
        question=payload.question,
        history=payload.history,
        context=payload.context
    )
    return AdvisorResponse(answer=answer)


@app.post("/forecast", response_model=ForecastResponse)
def get_5y_forecast(payload: ForecastRequest):
    return forecast_engine.generate_5y_forecast(payload)


@app.post("/explain", response_model=ExplainResponse)
def explain_trade(payload: ExplainRequest):
    explanation = ai_explainer.explain_trade(payload.dict())
    return ExplainResponse(explanation=explanation)


@app.post("/enhance-signal", response_model=EnhanceResponse)
def enhance_signal(payload: EnhanceRequest):
    # Map request to enhancer format
    signal_data = {
        "direction": payload.direction,
        "entry_price": payload.entry_price,
        "stop_loss": payload.stop_loss,
        "take_profit": payload.take_profit,
        "support": payload.support_levels,
        "resistance": payload.resistance_levels,
        "confidence": 50, # Default for manual enhancement
        "market": payload.market,
        "symbol": payload.symbol,
        "timeframe": payload.timeframe
    }
    
    metadata = {
        "volume": payload.volume,
        "avg_volume": payload.avg_volume,
        "atr": payload.atr,
        "current_price": payload.current_price
    }
    
    enhanced = signal_enhancer.enhance(signal_data, metadata)
    
    return EnhanceResponse(
        valid=enhanced["validity"],
        confidence_score=float(enhanced["confidence"]),
        refined_entry=enhanced["refined_entry"],
        entry_zone=enhanced["entry_zone"],
        stop_loss=enhanced["stop_loss"],
        take_profit=enhanced["take_profit"],
        reason=enhanced["refinement_reason"]
    )
