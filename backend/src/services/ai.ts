import { GoogleGenerativeAI } from "@google/generative-ai";
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

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  // Handle data: URIs directly — no network fetch needed
  if (url.startsWith("data:")) {
    const [header, base64] = url.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "");
    return { base64, mimeType };
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.split(";")[0].trim();
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mimeType };
}

export async function analyzeChart(request: AnalysisRequest): Promise<AnalysisResult> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { base64, mimeType } = await fetchImageAsBase64(request.imageUrl);

  const prompt = `You are an expert trading analyst specializing in scalping and intraday chart analysis.

Analyze this ${request.market ?? "stock"} chart${request.symbol ? ` for ${request.symbol}` : ""}${request.timeframe ? ` on the ${request.timeframe} timeframe` : ""}.

Provide a complete JSON analysis with ONLY the following fields (no markdown, no explanation, pure JSON only):

{
  "direction": "long" or "short",
  "symbol": "detected ticker or asset name",
  "timeframe": "detected timeframe e.g. 5m, 15m, 1h, 1d",
  "entry_price": <number or null>,
  "stop_loss": <number or null>,
  "take_profit": <number or null>,
  "risk_reward": <number ratio e.g. 2.1 or null>,
  "confidence": <integer 0-100>,
  "pattern": "detected chart pattern e.g. Bull Flag, Head & Shoulders, Double Bottom",
  "rsi": <detected RSI value as number or null>,
  "macd": "Bullish", "Bearish", or "Neutral",
  "summary": "2-3 sentence technical reasoning explaining the setup, key levels, and rationale"
}

Rules:
- entry_price, stop_loss, take_profit must be actual price levels visible on the chart
- If you cannot determine a value, use null
- confidence should reflect how clear and strong the setup is (50-95 realistic range)
- summary must specifically mention the pattern, key levels, and why entry is valid`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp"
      }
    },
    prompt
  ]);

  const text = result.response.text().trim();

  // Strip markdown code fences if model wraps in ```json ... ```
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
