import { MarketQuote } from "@/lib/api";
import { DataValidator } from "./dataValidator";
import { fallbackService } from "./fallbackService";
import { healthMonitor } from "../system/healthMonitor";
import { PerformanceGuard } from "../system/performanceGuard";

class MarketDataService {
  private cache: Map<string, { data: MarketQuote; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15000; // 15 seconds

  async fetchQuote(market: string, symbol: string): Promise<MarketQuote> {
    const cacheKey = `${market}:${symbol}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }

    const startTime = Date.now();
    try {
      const data = await PerformanceGuard.withTimeout(
        this.callAPI(market, symbol),
        5000,
        `Timeout fetching ${symbol}`
      );

      if (DataValidator.validateMarketQuote(data)) {
        this.cache.set(cacheKey, { data, timestamp: now });
        fallbackService.saveGoodData(symbol, data);
        healthMonitor.trackMetric("market_api", Date.now() - startTime, true);
        return data;
      } else {
        throw new Error(`Invalid data received for ${symbol}`);
      }
    } catch (error) {
      healthMonitor.trackMetric("market_api", Date.now() - startTime, false);
      const fallback = fallbackService.getFallback(symbol);
      if (fallback) return fallback;
      return fallbackService.getDefaultQuote(symbol);
    }
  }

  private async callAPI(market: string, symbol: string): Promise<MarketQuote> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const response = await fetch(`${apiBaseUrl}/market/quote/${market}/${symbol}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }
}

export const marketDataService = new MarketDataService();
