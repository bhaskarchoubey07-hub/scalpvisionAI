import { LiveMarketData } from "./marketDataService";

export class FallbackService {
  static resolveBestData(live: LiveMarketData | null, cached: LiveMarketData | null): LiveMarketData {
    if (live && live.status === "live") {
      return live;
    }

    if (cached) {
      return {
        ...cached,
        status: "cached",
        error: "Using cached data due to live API failure"
      };
    }

    throw new Error("No data available (Live and Cached failed)");
  }

  static getStatusLabel(status: "live" | "cached" | "error"): { label: string; color: string } {
    switch (status) {
      case "live": return { label: "Live Data Active", color: "text-emerald-400" };
      case "cached": return { label: "Using Cached Data", color: "text-amber-400" };
      case "error": return { label: "Data Error", color: "text-red-400" };
    }
  }
}
