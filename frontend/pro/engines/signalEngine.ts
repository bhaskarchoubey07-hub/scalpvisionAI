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
  static generateSignal(symbol: string, currentPrice: number, changeValue: number): SignalData {
    // Advanced algorithmic decision making based on momentum
    const isBullish = changeValue > 0;
    const volatility = Math.abs(changeValue) / currentPrice;
    
    // Confidence calculation (0-100)
    let confidence = 60 + (volatility * 1000); 
    if (confidence > 98) confidence = 98;
    
    const direction = isBullish ? "LONG" : "SHORT";
    const multiplier = direction === "LONG" ? 1 : -1;
    
    return {
      asset_symbol: symbol,
      direction,
      entry_price: currentPrice,
      take_profit: +(currentPrice + (currentPrice * 0.02 * multiplier)).toFixed(2),
      stop_loss: +(currentPrice - (currentPrice * 0.01 * multiplier)).toFixed(2),
      confidence: Math.round(confidence),
      timestamp: new Date().toISOString()
    };
  }
}
