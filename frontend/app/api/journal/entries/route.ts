import { NextResponse } from "next/server";

export async function GET() {
  const entries = [
    { id: 1, date: "2024-10-24", asset: "RELIANCE.NS", type: "LONG", pnl: 4200, outcome: "win", notes: "Breakout confirmed on M15 with high volume." },
    { id: 2, date: "2024-10-23", asset: "BTCUSDT", type: "SHORT", pnl: -120, outcome: "loss", notes: "Stop loss hit after unexpected volatility spike." },
    { id: 3, date: "2024-10-22", asset: "ETHUSDT", type: "LONG", pnl: 450, outcome: "win", notes: "RSI divergence played out perfectly." },
  ];
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  try {
    const entry = await req.json();
    return NextResponse.json({ success: true, entry: { ...entry, id: Date.now() } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
