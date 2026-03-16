export const latestSignal = {
  id: "sig_demo_btc",
  asset: "BTC/USDT",
  market: "Crypto",
  direction: "Long",
  entry: "64250.00",
  stopLoss: "63890.00",
  takeProfit: "64980.00",
  confidence: 87,
  riskReward: "2.03",
  notes: [
    "Bull flag continuation aligned with intraday support.",
    "RSI regained 50 and MACD histogram flipped positive.",
    "Volume cluster confirms demand near the breakout retest."
  ]
};

export const watchlist = [
  { symbol: "BTC/USDT", market: "Crypto", status: "Setup forming", change: "+2.3%" },
  { symbol: "ETH/USDT", market: "Crypto", status: "Breakout watch", change: "+1.2%" },
  { symbol: "NVDA", market: "Stock", status: "VWAP retest", change: "+0.8%" },
  { symbol: "TSLA", market: "Stock", status: "Momentum spike", change: "-0.5%" }
];

export const leaderboard = [
  { name: "A. Morgan", score: "1842", winRate: "78%", trades: 213 },
  { name: "S. Chen", score: "1736", winRate: "75%", trades: 188 },
  { name: "R. Patel", score: "1614", winRate: "72%", trades: 140 }
];
