import { MarketQuote } from "@/lib/api";

class FallbackService {
  private lastGoodData: Map<string, MarketQuote> = new Map();

  saveGoodData(symbol: string, data: MarketQuote) {
    this.lastGoodData.set(symbol, { ...data, source: "fallback" });
  }

  getFallback(symbol: string): MarketQuote | null {
    return this.lastGoodData.get(symbol) || null;
  }

  getDefaultQuote(symbol: string): MarketQuote {
    return {
      symbol,
      market: "stock",
      price: 0,
      changePercent: 0,
      changeValue: 0,
      currency: "USD",
      source: "static_default",
      asOf: new Date().toISOString()
    };
  }
}

export const fallbackService = new FallbackService();
