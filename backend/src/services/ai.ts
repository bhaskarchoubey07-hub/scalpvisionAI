import { config } from "../config.js";

type AnalysisRequest = {
  imageUrl: string;
  market: string;
  symbol?: string;
  timeframe?: string;
};

export async function analyzeChart(request: AnalysisRequest) {
  const response = await fetch(`${config.aiServiceUrl}/analyze-chart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_url: request.imageUrl,
      market: request.market,
      symbol: request.symbol,
      timeframe: request.timeframe
    })
  });

  if (!response.ok) {
    throw new Error(`AI service failed with status ${response.status}`);
  }

  return response.json();
}
