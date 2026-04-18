export interface SignalData {
  asset_symbol: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  take_profit: number;
  stop_loss: number;
  confidence: number;
  status: "HIGH" | "MEDIUM";
}

export const generateSignal = (symbol: string, price: number, changeValue: number): SignalData => {
  const isBullish = changeValue >= 0;
  const direction: "LONG" | "SHORT" = isBullish ? "LONG" : "SHORT";
  
  const entry_price = price;
  const take_profit = isBullish ? price * 1.01 : price * 0.99;
  const stop_loss = isBullish ? price * 0.995 : price * 1.005;
  const confidence = Math.floor(Math.random() * 21) + 70; // 70-90
  const status: "HIGH" | "MEDIUM" = confidence > 80 ? "HIGH" : "MEDIUM";

  return {
    asset_symbol: symbol,
    direction,
    entry_price: parseFloat(entry_price.toFixed(2)),
    take_profit: parseFloat(take_profit.toFixed(2)),
    stop_loss: parseFloat(stop_loss.toFixed(2)),
    confidence,
    status
  };
};
