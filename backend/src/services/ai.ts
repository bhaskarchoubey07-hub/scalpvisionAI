import { config } from "../config.js";

type AnalysisRequest = {
  imageUrl: string;
  market: string;
  symbol?: string;
  timeframe?: string;
};

type AnalysisResult = {
  direction: string;
  market: string;
  symbol?: string;
  entry_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  risk_reward?: number | null;
  confidence?: number | null;
  summary?: string | null;
  pattern?: string | null;
  rsi?: number | null;
  macd?: string | null;
  timeframe?: string | null;
};

function safeNum(val: unknown): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export async function analyzeChart(request: AnalysisRequest): Promise<AnalysisResult> {
  const aiServiceUrl = config.aiServiceUrl || "http://localhost:8000";
  
  const response = await fetch(`${aiServiceUrl}/analyze-chart`, {
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`AI Service error: ${response.statusText} ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();

  return {
    direction: data.direction,
    market: data.market,
    symbol: data.symbol,
    entry_price: safeNum(data.entry_price),
    stop_loss: safeNum(data.stop_loss),
    take_profit: safeNum(data.take_profit),
    risk_reward: safeNum(data.risk_reward),
    confidence: safeNum(data.confidence),
    pattern: data.patterns?.[0] || null,
    rsi: safeNum(data.indicators?.find((i: any) => i.name === "RSI")?.value.match(/\d+/)?.[0]),
    macd: data.indicators?.find((i: any) => i.name === "MACD")?.bias || null,
    timeframe: data.timeframe,
    summary: data.summary,
  };
}
