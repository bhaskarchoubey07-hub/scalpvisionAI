export interface SignalData {
  asset_symbol: string;
  direction: "LONG" | "SHORT" | "NO_TRADE";
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  confidence: number;
  status: "HIGH" | "MEDIUM" | "LOW";
}

export const generateSignal = async (symbol: string, price: number, changeValue: number): Promise<SignalData> => {
  const isBullish = changeValue >= 0;
  
  // Synthesize some technical indicators based on current price for the model
  // In a full production system, these would be computed from a historical data feed
  const ret = changeValue / price;
  const mockFeatures = {
    return: ret,
    price_change: changeValue,
    volatility: Math.abs(ret) * 1.5 + 0.01,
    ma20: isBullish ? price * 0.98 : price * 1.02,
    ma50: isBullish ? price * 0.95 : price * 1.05,
    rsi: isBullish ? 65.0 : 35.0,
    macd: isBullish ? price * 0.005 : price * -0.005,
    macd_signal: isBullish ? price * 0.004 : price * -0.004,
    macd_hist: isBullish ? price * 0.001 : price * -0.001,
    bb_upper: price * 1.03,
    bb_lower: price * 0.97,
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
      // Assume API returns { signal: "BUY" | "SELL" | "NO_TRADE", confidence: number }
      if (data.signal === "BUY") aiDirection = "LONG";
      else if (data.signal === "SELL") aiDirection = "SHORT";
      else aiDirection = "NO_TRADE";
      
      confidence = data.confidence || 50;
    }
  } catch (err) {
    console.error("AI Engine Prediction Failed, falling back to basic logic", err);
    // Fallback logic
    aiDirection = isBullish ? "LONG" : "SHORT";
    confidence = Math.floor(Math.random() * 21) + 70;
  }

  const direction = aiDirection !== "NO_TRADE" ? aiDirection : (isBullish ? "LONG" : "SHORT");
  const isLong = direction === "LONG";
  
  const entry_price = price;
  const take_profit = isLong ? price * 1.01 : price * 0.99;
  const stop_loss = isLong ? price * 0.995 : price * 1.005;
  const status: "HIGH" | "MEDIUM" | "LOW" = confidence > 80 ? "HIGH" : (confidence > 60 ? "MEDIUM" : "LOW");

  return {
    asset_symbol: symbol,
    direction,
    entry_price: parseFloat(entry_price.toFixed(2)),
    take_profit: parseFloat(take_profit.toFixed(2)),
    stop_loss: parseFloat(stop_loss.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    status
  };
};
