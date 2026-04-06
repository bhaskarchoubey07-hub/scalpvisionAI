import { GoogleGenAI } from "@google/genai";
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

function imageToInlineData(url: string): { data: string; mimeType: string } {
  if (url.startsWith("data:")) {
    const [header, data] = url.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "");
    return { data, mimeType };
  }
  throw new Error("Only data: URIs are supported for inline image data.");
}

export async function analyzeChart(request: AnalysisRequest): Promise<AnalysisResult> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const { data, mimeType } = imageToInlineData(request.imageUrl);

  const prompt = `You are an expert trading analyst specializing in scalping and intraday chart analysis.

Analyze this ${request.market ?? "stock"} chart${request.symbol ? ` for ${request.symbol}` : ""}${request.timeframe ? ` on the ${request.timeframe} timeframe` : ""}.

Return ONLY a valid JSON object with no markdown, no explanation, no code fences. Pure JSON only:

{
  "direction": "long" or "short",
  "symbol": "detected ticker or asset name",
  "timeframe": "detected timeframe e.g. 5m, 15m, 1h, 1d",
  "entry_price": <number or null>,
  "stop_loss": <number or null>,
  "take_profit": <number or null>,
  "risk_reward": <number e.g. 2.1 or null>,
  "confidence": <integer 0-100>,
  "pattern": "detected chart pattern e.g. Bull Flag, Head & Shoulders, Double Bottom",
  "rsi": <RSI value as number or null>,
  "macd": "Bullish", "Bearish", or "Neutral",
  "summary": "2-3 sentence technical reasoning explaining the setup, key levels, and rationale"
}

Rules:
- entry_price, stop_loss, take_profit must be actual price levels visible on the chart
- If you cannot determine a value, use null
- confidence should reflect how clear the setup is (realistic range 50-95)
- summary must mention the pattern, key levels, and why this entry is valid`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          { inlineData: { data, mimeType } },
          { text: prompt }
        ]
      }
    ]
  });

  const text = (response.text ?? "").trim();
  const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    throw new Error("AI returned non-JSON response. Please try again.");
  }

  return {
    direction: String(parsed.direction ?? "long"),
    market: request.market ?? "stock",
    symbol: parsed.symbol ? String(parsed.symbol) : request.symbol,
    entry_price: safeNum(parsed.entry_price),
    stop_loss: safeNum(parsed.stop_loss),
    take_profit: safeNum(parsed.take_profit),
    risk_reward: safeNum(parsed.risk_reward),
    confidence: safeNum(parsed.confidence),
    pattern: parsed.pattern ? String(parsed.pattern) : null,
    rsi: safeNum(parsed.rsi),
    macd: parsed.macd ? String(parsed.macd) : null,
    timeframe: parsed.timeframe ? String(parsed.timeframe) : request.timeframe ?? null,
    summary: parsed.summary ? String(parsed.summary) : null,
  };
}
