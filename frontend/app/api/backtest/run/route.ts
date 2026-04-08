import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { strategy, range } = await req.json();
    return NextResponse.json({
      net_profit: 4242.00,
      max_drawdown: -4.2,
      sharpe_ratio: 3.12,
      total_trades: 42,
      win_rate: 71.4,
      equity_curve: Array.from({ length: 100 }, (_, i) => ({
        x: i,
        y: 10000 + Math.random() * 5000 + i * 50
      })),
      timestamp: new Date().toISOString(),
      strategy_used: strategy,
      range_simulated: range
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
