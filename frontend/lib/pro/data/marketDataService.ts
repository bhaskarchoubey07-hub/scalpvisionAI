import { MarketQuote, Candle, fetchCandles } from "@/lib/api";

export interface LiveMarketData extends MarketQuote {
  ohlc?: Candle;
  status: "live" | "cached" | "error";
  error?: string;
}

class MarketDataService {
  private cache: Map<string, { data: LiveMarketData; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  async fetchLiveQuote(market: string, symbol: string): Promise<LiveMarketData> {
    const cacheKey = `${market}:${symbol}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return { ...cached.data, status: "cached" };
    }

    try {
      // Use existing API but with retry logic
      const data = await this.retryFetch(() => this.getQuoteFromAPI(market, symbol), 3);
      
      const liveData: LiveMarketData = {
        ...data,
        status: "live"
      };

      this.cache.set(cacheKey, { data: liveData, timestamp: now });
      return liveData;
    } catch (error) {
      if (cached) {
        return { ...cached.data, status: "cached", error: (error as Error).message };
      }
      throw error;
    }
  }

  private async getQuoteFromAPI(market: string, symbol: string): Promise<MarketQuote> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const response = await fetch(`${apiBaseUrl}/market/quote?market=${market}&symbol=${symbol}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  private async retryFetch<T>(fn: () => Promise<T>, retries: number): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
    throw new Error("Retry failed");
  }

  async fetchLiveCandles(symbol: string, range = "1d", interval = "1m"): Promise<Candle[]> {
     return this.retryFetch(() => fetchCandles(symbol, range, interval), 2);
  }
}

export const marketDataService = new MarketDataService();
