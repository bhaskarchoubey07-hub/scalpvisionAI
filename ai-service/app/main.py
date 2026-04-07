from fastapi import FastAPI

from .schemas import AnalyzeRequest, AnalyzeResponse, AdvisorRequest, AdvisorResponse, ForecastRequest, ForecastResponse
from .services.pipeline import run_analysis_pipeline
from .services.ai_explainer import ai_explainer
from .services.forecast_engine import forecast_engine

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
