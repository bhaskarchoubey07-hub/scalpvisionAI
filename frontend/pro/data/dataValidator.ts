import { MarketQuote } from "@/lib/api";

export class DataValidator {
  static validateMarketQuote(data: any): data is MarketQuote {
    if (!data || typeof data !== "object") return false;
    
    const requiredFields = ["symbol", "price", "changePercent"];
    const hasFields = requiredFields.every(field => field in data && data[field] !== null && data[field] !== undefined);
    
    if (!hasFields) return false;

    // Freshness check: data should be within the last 5 minutes if it has a timestamp
    if (data.asOf) {
      const timestamp = new Date(data.asOf).getTime();
      const now = Date.now();
      if (now - timestamp > 300000) { // 5 minutes
        console.warn(`[DATA_VALIDATOR] Stale data for ${data.symbol}: ${data.asOf}`);
        return false;
      }
    }

    return true;
  }

  static sanitizeString(str: string): string {
    return str.trim().toUpperCase();
  }
}
