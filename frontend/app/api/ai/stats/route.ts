import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    win_rate: 68.4,
    avg_conviction: 82.5,
    risk_score: "low",
    profit_factor: 2.42,
    total_trades: 1240,
    timestamp: new Date().toISOString()
  });
}
