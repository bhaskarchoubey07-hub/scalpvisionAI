import { marketDataService } from "../data/marketDataService";
import { SignalEngine, SignalData } from "../engines/signalEngine";
import { ValidationEngine } from "../engines/validationEngine";
import { GlobalErrorHandler } from "../system/errorHandler";

const DEFAULT_SYMBOLS = [
  { symbol: "BTC-USD", market: "crypto" },
  { symbol: "ETH-USD", market: "crypto" },
  { symbol: "RELIANCE.NS", market: "indian-stock" },
  { symbol: "TATASTEEL.NS", market: "indian-stock" },
  { symbol: "AAPL", market: "stock" },
  { symbol: "EURUSD=X", market: "forex" }
];

export class SignalService {
  static async getSignals(symbols = DEFAULT_SYMBOLS): Promise<SignalData[]> {
    return GlobalErrorHandler.wrapAsync(async () => {
      const signalPromises = symbols.map(async (item) => {
        try {
          const quote = await marketDataService.fetchQuote(item.market, item.symbol);
          const signal = SignalEngine.generateSignal(quote.symbol, quote.price, quote.changeValue);
          
          if (ValidationEngine.isValidSignal(signal)) {
            return signal;
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(signalPromises);
      return results.filter((s): s is SignalData => s !== null);
    }, { feature: "Signals", action: "fetch" }, []);
  }
}
