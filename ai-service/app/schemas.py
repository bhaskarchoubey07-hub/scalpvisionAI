from typing import List, Literal, Optional

from pydantic import BaseModel, HttpUrl


class AnalyzeRequest(BaseModel):
    image_url: Optional[HttpUrl] = None
    market: Literal["stock", "crypto", "indian-stock", "forex"]
    symbol: Optional[str] = None
    timeframe: Optional[str] = "5m"


class IndicatorReading(BaseModel):
    name: str
    value: str
    bias: Literal["bullish", "bearish", "neutral"]


class AnalyzeResponse(BaseModel):
    market: str
    symbol: str
    timeframe: str
    chart_type: str
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: float
    direction: Literal["long", "short"]
    patterns: List[str]
    support_levels: List[float]
    resistance_levels: List[float]
    indicators: List[IndicatorReading]
    summary: str
