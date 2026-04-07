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
  if (!config.openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured on the server.");
  }

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

  // Note: gpt-3.5-turbo does not support vision. 
  // To use vision, switch model to "openai/gpt-4o-mini" and uncomment the image_url part below.
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.openRouterApiKey}`,
      "HTTP-Referer": config.frontendUrl,
      "X-Title": "ChartSniper AI",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt }
            // { type: "image_url", image_url: { url: request.imageUrl } } 
          ]
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.statusText} ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned empty response. Please try again.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
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
