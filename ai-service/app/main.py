from fastapi import FastAPI

from .schemas import AnalyzeRequest, AnalyzeResponse
from .services.pipeline import run_analysis_pipeline

app = FastAPI(title="ScalpVision AI Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "ai-engine"}


@app.post("/analyze-chart", response_model=AnalyzeResponse)
def analyze_chart(payload: AnalyzeRequest):
    return run_analysis_pipeline(payload)
