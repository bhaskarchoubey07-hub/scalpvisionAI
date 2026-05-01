export type SignalData = {
  asset_symbol: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  confidence: number;
  timestamp: string;
};

export class SignalEngine {
  static async generateSignal(symbol: string, currentPrice: number, changeValue: number): Promise<SignalData> {
    const isBullish = changeValue >= 0;
    
    // Synthesize some technical indicators based on current price for the model
    const ret = changeValue / currentPrice;
    const mockFeatures = {
      return: ret,
      price_change: changeValue,
      volatility: Math.abs(ret) * 1.5 + 0.01,
      ma20: isBullish ? currentPrice * 0.98 : currentPrice * 1.02,
      ma50: isBullish ? currentPrice * 0.95 : currentPrice * 1.05,
      rsi: isBullish ? 65.0 : 35.0,
      macd: isBullish ? currentPrice * 0.005 : currentPrice * -0.005,
      macd_signal: isBullish ? currentPrice * 0.004 : currentPrice * -0.004,
      macd_hist: isBullish ? currentPrice * 0.001 : currentPrice * -0.001,
      bb_upper: currentPrice * 1.03,
      bb_lower: currentPrice * 0.97,
      bb_width: 0.06
    };

    let aiDirection: "LONG" | "SHORT" | "NO_TRADE" = "NO_TRADE";
    let confidence = 50;

    try {
      const response = await fetch("http://127.0.0.1:8001/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockFeatures)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.signal === "BUY") aiDirection = "LONG";
        else if (data.signal === "SELL") aiDirection = "SHORT";
        else aiDirection = "NO_TRADE";
        
        confidence = aiDirection === "NO_TRADE" ? 0 : (data.confidence || 50);
      }
    } catch (err) {
      console.error("AI Engine Prediction Failed, falling back to basic logic", err);
      aiDirection = isBullish ? "LONG" : "SHORT";
      confidence = 60 + (Math.abs(ret) * 1000); 
      if (confidence > 98) confidence = 98;
    }

    const direction = aiDirection !== "NO_TRADE" ? aiDirection : (isBullish ? "LONG" : "SHORT");
    const multiplier = direction === "LONG" ? 1 : -1;
    
    return {
      asset_symbol: symbol,
      direction: direction,
      entry_price: currentPrice,
      take_profit: +(currentPrice + (currentPrice * 0.02 * multiplier)).toFixed(2),
      stop_loss: +(currentPrice - (currentPrice * 0.01 * multiplier)).toFixed(2),
      confidence: Math.round(confidence),
      timestamp: new Date().toISOString()
    };
  }
}
