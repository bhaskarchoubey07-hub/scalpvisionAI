import { AnalysisResult } from "@/lib/api";

export interface MarketContext {
  trend: "Bullish" | "Bearish" | "Neutral";
  volatility: "Abnormal" | "Normal" | "Low";
  validMarket: boolean;
}

export function detectMarketContext(data: AnalysisResult): MarketContext {
  const trend = data.trend === "bullish" ? "Bullish" : data.trend === "bearish" ? "Bearish" : "Neutral";
  
  // Abnormal volatility check (e.g., > 3% on daily is high for indices/stable stocks)
  const volatilityPercent = data.volatility_percent || 0;
  let volatility: MarketContext["volatility"] = "Normal";
  if (volatilityPercent > 4) volatility = "Abnormal";
  if (volatilityPercent < 0.5) volatility = "Low";

  // Index alignment check (Mocked for now as we don't have broad market index api here)
  const indexMatch = true; 

  // Market is invalid if sideways (Neutral) or Abnormal volatility
  const validMarket = trend !== "Neutral" && volatility !== "Abnormal" && indexMatch;

  return { trend, volatility, validMarket };
}
