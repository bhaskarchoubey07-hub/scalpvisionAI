import { GlobalErrorHandler } from "../system/errorHandler";

export type PredictionResult = {
  forecast: string;
  trend: "bullish" | "bearish" | "neutral";
  confidence: number;
};

export class PredictionService {
  static async getPrediction(symbol: string, market: string): Promise<PredictionResult> {
    return GlobalErrorHandler.wrapAsync(async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/market/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, market })
      });
      
      if (!response.ok) throw new Error("Prediction API failed");
      
      const data = await response.json();
      return {
        forecast: data.narrative,
        trend: data.trend,
        confidence: data.confidence_score * 100
      };
    }, { feature: "Prediction", action: "fetch", symbol }, {
      forecast: "AI Prediction currently unavailable for this asset.",
      trend: "neutral",
      confidence: 0
    });
  }
}
