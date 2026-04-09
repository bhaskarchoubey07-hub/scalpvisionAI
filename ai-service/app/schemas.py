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
    # Metadata for Signal Enhancer (Optional)
    volume: Optional[float] = None
    avg_volume: Optional[float] = None
    atr: Optional[float] = None
    volatility: Optional[float] = None

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
    # Refinement Fields
    refined_entry: Optional[float] = None
    entry_zone: Optional[str] = None
    validity: bool = True
    refinement_reason: Optional[str] = None

class AdvisorRequest(BaseModel):
    question: str
    history: Optional[List[dict]] = []
    context: Optional[dict] = {}

class AdvisorResponse(BaseModel):
    answer: str
    confidence: float = 0.95

class ForecastPoint(BaseModel):
    date: str
    price: float
    is_forecast: bool = False

class ForecastRequest(BaseModel):
    symbol: str
    historical_data: List[dict] # [{date: '...', price: ...}]
    forecast_years: int = 5

class ForecastPointSimple(BaseModel):
    date: str
    price: float
    is_forecast: bool

class ForecastResponse(BaseModel):
    points: List[ForecastPointSimple]
    narrative: str
    confidence_score: float
    trend: Literal["bullish", "bearish", "neutral"]

class ExplainRequest(BaseModel):
    symbol: str
    market: str
    direction: str
    confidence: float
    trend: str
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: float
    indicators: List[dict]

class ExplainResponse(BaseModel):
    explanation: str

class EnhanceRequest(BaseModel):
    symbol: str
    market: str
    direction: Literal["long", "short", "neutral"]
    entry_price: float
    stop_loss: float
    take_profit: float
    current_price: float
    timeframe: str = "5m"
    volume: Optional[float] = None
    avg_volume: Optional[float] = None
    atr: Optional[float] = None
    support_levels: List[float] = []
    resistance_levels: List[float] = []

class EnhanceResponse(BaseModel):
    valid: bool
    confidence_score: float
    refined_entry: float
    entry_zone: str
    stop_loss: float
    take_profit: float
    reason: str
