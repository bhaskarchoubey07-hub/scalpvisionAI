import { MarketQuote } from "@/lib/api";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DataValidator {
  static validateQuote(quote: MarketQuote | null): ValidationResult {
    const errors: string[] = [];
    
    if (!quote) {
      return { isValid: false, errors: ["Quote data is null or undefined."] };
    }

    if (quote.price === null || quote.price === undefined || quote.price <= 0) {
      errors.push("Invalid price value (null or <= 0).");
    }

    // Check for extreme outliers if needed, but primarily basic consistency
    if (isNaN(quote.price)) {
      errors.push("Price is not a number.");
    }

    // Freshness check: data should not be older than 60 seconds for "Live" label
    const dataTime = new Date(quote.asOf).getTime();
    const now = Date.now();
    if (now - dataTime > 60000) {
      errors.push("Data is stale (older than 60 seconds).");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePriceConsistency(high: number, low: number, close: number): boolean {
    return high >= low && high >= close && low <= close;
  }
}
