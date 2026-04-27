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
from .ml.data_pipeline import DataPipeline
from .ml.features import FeatureEngineer
from .ml.labeling import Labeler
from .ml.trainer import ModelTrainer
from .ml.backtester import Backtester

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


@app.post("/ml/predict", response_model=MLPredictResponse)
def ml_predict(payload: MLPredictRequest):
    dp = DataPipeline()
    fe = FeatureEngineer()
    trainer = ModelTrainer()
    
    # Get latest data
    df = dp.fetch_historical_data(payload.symbol, payload.timeframe, period="60d")
    df_features = fe.get_features(df)
    
    # Load model
    model = trainer.load_model(f"{payload.symbol}_{payload.timeframe}_{payload.model_type}")
    
    # Predict
    latest_features = df_features.iloc[[-1]].drop(columns=['timestamp'])
    if 'target' in latest_features.columns:
        latest_features = latest_features.drop(columns=['target'])
        
    probs = model.predict_proba(latest_features)[0]
    pred = model.predict(latest_features)[0]
    
    signals = {0: "HOLD", 1: "BUY", 2: "SELL"}
    
    return MLPredictResponse(
        signal=signals[pred],
        confidence=float(max(probs) * 100),
        probability=float(max(probs)),
        features_used=latest_features.columns.tolist(),
        current_price=float(df['close'].iloc[-1])
    )


@app.post("/ml/train", response_model=MLTrainResponse)
def ml_train(payload: MLTrainRequest):
    dp = DataPipeline()
    fe = FeatureEngineer()
    labeler = Labeler()
    trainer = ModelTrainer()
    
    # 1. Fetch & Sync
    df = dp.fetch_historical_data(payload.symbol, payload.timeframe, period=payload.period)
    dp.sync_to_db(payload.symbol, payload.timeframe, df)
    
    # 2. Features & Labels
    df_features = fe.get_features(df)
    df_labeled = labeler.label_data(df_features)
    
    # 3. Train
    X = df_labeled.drop(columns=['target', 'timestamp'])
    y = df_labeled['target']
    
    # Simple split for now
    split = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]
    
    if payload.model_type == 'xgboost':
        model = trainer.train_xgboost(X_train, y_train)
    else:
        model = trainer.train_random_forest(X_train, y_train)
        
    metrics = trainer.validate(model, X_test, y_test)
    
    # 4. Save
    model_name = f"{payload.symbol}_{payload.timeframe}_{payload.model_type}"
    trainer.save_model(model, model_name)
    
    return MLTrainResponse(
        status="success",
        metrics=metrics,
        model_version="1.0.0"
    )
