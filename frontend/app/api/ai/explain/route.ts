import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { symbol } = await req.json();
    return NextResponse.json({
      explanation: `The algorithm detected a bullish divergence on the H1 timeframe for ${symbol} while the D1 trend remains firmly above the 200 EMA. Volume profile indicates a POC (Point of Control) cluster just below current price, providing a high-probability liquidity floor.`,
      tags: ["Bullish Divergence", "POC Cluster", "EMA 200 Support"],
      conviction_score: 84.7,
      sentiment: "Bullish"
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
