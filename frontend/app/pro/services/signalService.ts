import { marketDataService } from "@/lib/pro/data/marketDataService";
import { generateSignal, SignalData } from "../engines/signalEngine";

const DEFAULT_SYMBOLS = [
  { symbol: "BTC-USD", market: "crypto" },
  { symbol: "ETH-USD", market: "crypto" },
  { symbol: "RELIANCE.NS", market: "indian-stock" },
  { symbol: "TATASTEEL.NS", market: "indian-stock" },
  { symbol: "AAPL", market: "stock" },
  { symbol: "EURUSD=X", market: "forex" }
];

export const getSignals = async (symbols = DEFAULT_SYMBOLS): Promise<SignalData[]> => {
  const signalPromises = symbols.map(async (item) => {
    try {
      const quote = await marketDataService.fetchLiveQuote(item.market, item.symbol);
      if (quote.status === "error") return null;
      
      return await generateSignal(quote.symbol, quote.price, quote.changeValue);
    } catch (error) {
      console.warn(`Failed to fetch signal for ${item.symbol}:`, error);
      return null;
    }
  });

  const results = await Promise.all(signalPromises);
  return results.filter((s): s is SignalData => s !== null);
};
