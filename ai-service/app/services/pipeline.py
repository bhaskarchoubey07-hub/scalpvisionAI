from ..schemas import AnalyzeRequest, AnalyzeResponse, IndicatorReading


def preprocess_image(_image_url: str) -> dict:
    return {"cleaned": True, "crop_detected": True, "chart_type": "candlestick"}


def detect_patterns(_preprocessed: dict) -> list[str]:
    return ["bull_flag", "ascending_support"]


def detect_levels(_preprocessed: dict) -> tuple[list[float], list[float]]:
    return [64120.0, 63940.0], [64620.0, 64980.0]


def extract_indicators(_preprocessed: dict) -> list[IndicatorReading]:
    return [
        IndicatorReading(name="RSI", value="54.2", bias="bullish"),
        IndicatorReading(name="MACD", value="Positive histogram flip", bias="bullish"),
    ]


def generate_signal(request: AnalyzeRequest, support_levels: list[float], resistance_levels: list[float]) -> dict:
    entry = 64250.0 if request.market == "crypto" else 512.45
    stop = support_levels[-1] - 50 if request.market == "crypto" else support_levels[-1] - 1.5
    take_profit = resistance_levels[-1]
    risk_reward = round((take_profit - entry) / (entry - stop), 2)
    return {
      "market": request.market,
      "symbol": request.symbol or ("BTC/USDT" if request.market == "crypto" else "SPY"),
      "timeframe": request.timeframe or "5m",
      "entry_price": entry,
      "stop_loss": stop,
      "take_profit": take_profit,
      "risk_reward": risk_reward,
      "confidence": 87.0,
      "direction": "long",
      "summary": "Momentum continuation detected near reclaimed support with improving oscillator structure.",
    }


def run_analysis_pipeline(request: AnalyzeRequest) -> AnalyzeResponse:
    preprocessed = preprocess_image(str(request.image_url))
    patterns = detect_patterns(preprocessed)
    support_levels, resistance_levels = detect_levels(preprocessed)
    indicators = extract_indicators(preprocessed)
    signal = generate_signal(request, support_levels, resistance_levels)

    return AnalyzeResponse(
        chart_type=preprocessed["chart_type"],
        patterns=patterns,
        support_levels=support_levels,
        resistance_levels=resistance_levels,
        indicators=indicators,
        **signal,
    )
