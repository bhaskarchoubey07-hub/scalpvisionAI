from typing import List, Literal, Optional

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    image_url: Optional[str] = None
    market: Literal["stock", "crypto", "indian-stock", "forex"]
    symbol: Optional[str] = None
    timeframe: Optional[str] = "5m"
    current_price: Optional[float] = None
    rsi: Optional[float] = None
    macd_bias: Optional[str] = None


class IndicatorReading(BaseModel):
    name: str
    value: str
    bias: Literal["bullish", "bearish", "neutral"]


class AnalyzeResponse(BaseModel):
    symbol: str
    market: str
    direction: str
    confidence: int
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: float
    summary: str
    pattern: Optional[str] = None
    rsi: Optional[float] = None
    macd: Optional[str] = None
    timeframe: Optional[str] = "5m"

class AdvisorRequest(BaseModel):
    question: str
    history: Optional[List[dict]] = []
    context: Optional[dict] = {}

class AdvisorResponse(BaseModel):
    answer: str
    confidence: float = 0.95
    resistance_levels: List[float]
    indicators: List[IndicatorReading]
    summary: str
