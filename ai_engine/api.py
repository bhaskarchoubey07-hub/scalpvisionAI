from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
try:
    from predict import load_model, predict_signal, FEATURES
except ImportError:
    from ai_engine.predict import load_model, predict_signal, FEATURES
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock Prediction Engine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
model = None

@app.on_event("startup")
def startup_event():
    global model
    logger.info("Starting up API, loading model...")
    # Assume model is in the same directory or project root
    model_paths = ["trading_model_ensemble.pkl", "../trading_model_ensemble.pkl"]
    for path in model_paths:
        if os.path.exists(path):
            model = load_model(path)
            if model:
                logger.info(f"Model loaded successfully from {path}")
                break
    
    if model is None:
        logger.warning("Model could not be loaded. Ensure training has been run and 'trading_model_ensemble.pkl' exists.")

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict")
def predict_endpoint(data: dict):
    # Handle missing model
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Train the model first.")
        
    # Check if all required features exist
    missing_features = [f for f in FEATURES if f not in data and f != 'return']
    # Sometimes return is passed as 'return_' or 'return' due to python keywords
    if 'return' not in data and 'return_' not in data:
        missing_features.append('return')
        
    if missing_features:
        logger.error(f"Missing features in request: {missing_features}")
        raise HTTPException(status_code=400, detail=f"Missing features: {missing_features}")
        
    # Map return_ to return if needed
    if 'return_' in data and 'return' not in data:
        data['return'] = data['return_']
        
    try:
        # Get prediction with a realistic confidence threshold
        result = predict_signal(model, data, min_conf=0.70)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal prediction error")

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
