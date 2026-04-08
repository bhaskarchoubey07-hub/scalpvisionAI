const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type MarketQuote = {
  symbol: string;
  market: "stock" | "crypto" | "indian-stock" | "forex";
  price: number;
  changePercent: number;
  changeValue: number;
  currency: string;
  source: string;
  asOf: string;
};

export type MarketOverview = {
  stocks: MarketQuote[];
  crypto: MarketQuote[];
  indianStocks: MarketQuote[];
  forex: MarketQuote[];
  stockProvider: string;
  cryptoProvider: string;
  indianStockProvider: string;
  forexProvider: string;
};

export type WatchlistItem = {
  id: string;
  symbol: string;
  market: "stock" | "crypto" | "indian-stock" | "forex";
  notes?: string | null;
  created_at: string;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export async function fetchMarketOverview(): Promise<MarketOverview> {
  const response = await fetch(`${apiBaseUrl}/market/overview`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to load market overview");
  }

  return response.json();
}

export async function fetchWatchlist(token: string): Promise<WatchlistItem[]> {
  const response = await fetch(`${apiBaseUrl}/watchlist`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to load watchlist");
  }

  return response.json();
}

export async function addWatchlistItem(token: string, symbol: string, market: "stock" | "crypto" | "indian-stock" | "forex") {
  const response = await fetch(`${apiBaseUrl}/watchlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ symbol, market })
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.error ?? "Unable to add watchlist item");
  }

  return response;
}

export async function removeWatchlistItem(token: string, id: string) {
  const response = await fetch(`${apiBaseUrl}/watchlist/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to remove watchlist item");
  }
}

export async function fetchCandles(symbol: string, range = "3mo", interval = "1d"): Promise<Candle[]> {
  const url = new URL(`${apiBaseUrl}/market/candles`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load candle data");
  }
  const payload = await response.json();
  return payload.candles as Candle[];
}

/* ─────────────── Analysis Types ─────────────── */

export type IndicatorDetail = {
  name: string;
  value: string;
  bias: "bullish" | "bearish" | "neutral";
  weight: number;
  score: number;
};

export type TimeframeDetail = {
  timeframe: string;
  direction: string;
  confidence: number;
  net_score: number;
};

export type PatternDetail = {
  name: string;
  type: "bullish" | "bearish";
  strength: number;
  description: string;
};

export type AnalysisResult = {
  direction: string;
  signal: string;
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
  trend?: string;
  atr?: number;
  volatility_percent?: number;
  current_price?: number;
  indicators?: IndicatorDetail[];
  supports?: number[];
  resistances?: number[];
  pivot_point?: number;
  timeframe_analysis?: TimeframeDetail[];
  patterns?: PatternDetail[];
};

/* ─────────────── Upload & Analyze ─────────────── */

export async function uploadChart(file: File): Promise<{ imageUrl: string }> {
  const form = new FormData();
  form.append("chart", file);
  const response = await fetch(`${apiBaseUrl}/upload-chart`, {
    method: "POST",
    body: form
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? "Upload failed");
  }
  return response.json();
}

export async function analyzeChart(
  imageUrl: string,
  market: "stock" | "crypto" | "indian-stock" | "forex" = "stock",
  symbol?: string,
  timeframe?: string
): Promise<AnalysisResult> {
  const response = await fetch(`${apiBaseUrl}/analyze-chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, market, symbol, timeframe })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? "Analysis failed");
  }
  return response.json();
}

/**
 * Analyze a ticker symbol using real-time data — no image needed.
 * This is the primary analysis mode using the multi-indicator TA engine.
 */
export async function analyzeTicker(
  symbol: string,
  market: "stock" | "crypto" | "indian-stock" | "forex" = "indian-stock"
): Promise<AnalysisResult> {
  const response = await fetch(`${apiBaseUrl}/analyze-ticker`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, market })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? "Ticker analysis failed");
  }
  return response.json();
}

/* ─────────────── Indian Stocks ─────────────── */

export type IndianStock = {
  symbol: string;
  yahoo_symbol: string;
  company_name: string;
  sector: string;
  industry: string;
  exchange: string;
};

export async function fetchIndianStocksSearch(query: string): Promise<IndianStock[]> {
  const response = await fetch(`${apiBaseUrl}/market/indian-stocks/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

export async function fetchPopularIndianStocks(): Promise<IndianStock[]> {
  const response = await fetch(`${apiBaseUrl}/market/indian-stocks/popular`);
  if (!response.ok) throw new Error("Failed to load popular stocks");
  return response.json();
}

/* ─────────────── Forecast ─────────────── */

export type ForecastPoint = {
  date: string;
  price: number;
  is_forecast: boolean;
};

export type ForecastResult = {
  points: ForecastPoint[];
  narrative: string;
  confidence_score: number;
  trend: "bullish" | "bearish" | "neutral";
};

export async function fetchForecast(symbol: string, market: string): Promise<ForecastResult> {
  const response = await fetch(`${apiBaseUrl}/market/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, market })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? "Forecasting failed");
  }
  return response.json();
}

/* ─────────────── Portfolios ─────────────── */

export type PortfolioHolding = {
  id: string;
  symbol: string;
  market: string;
  quantity: number;
  avg_buy_price: number;
  added_at: string;
};

export type Portfolio = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  holdings: PortfolioHolding[];
};

export async function fetchPortfolios(token: string): Promise<Portfolio[]> {
  const response = await fetch(`${apiBaseUrl}/portfolios`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to load portfolios");
  return response.json();
}

export async function createPortfolio(token: string, name: string, description?: string) {
  const response = await fetch(`${apiBaseUrl}/portfolios`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, description })
  });
  return response.json();
}

export async function addPortfolioHolding(token: string, portfolioId: string, holding: Omit<PortfolioHolding, "id" | "added_at">) {
  const response = await fetch(`${apiBaseUrl}/portfolios/${portfolioId}/holdings`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      symbol: holding.symbol,
      market: holding.market,
      quantity: holding.quantity,
      avgBuyPrice: holding.avg_buy_price
    })
  });
  return response.json();
}

/* ─────────────── PRO Features ─────────────── */

export type ProSignal = {
  id: string;
  asset_symbol: string;
  market: string;
  timeframe: string;
  direction: string;
  entry_price: number;
  take_profit: number;
  confidence: number;
  status: string;
};

export type JournalEntry = {
  id: string;
  asset_symbol: string;
  market: string;
  direction: string;
  pnl: number;
  outcome: string;
  notes: string;
  tags: string[];
  trade_date: string;
};

export type BacktestResult = {
  net_profit: number;
  max_drawdown: string;
  sharpe_ratio: string;
  total_trades: number;
  win_rate: number;
  strategy_used: string;
  range_simulated: string;
};

export async function fetchProSignals(): Promise<ProSignal[]> {
  const response = await fetch(`${apiBaseUrl}/pro/signals`);
  if (!response.ok) throw new Error("Failed to load Pro signals");
  return response.json();
}

export async function fetchJournalEntries(token: string): Promise<JournalEntry[]> {
  const response = await fetch(`${apiBaseUrl}/pro/journal`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to load journal entries");
  return response.json();
}

export async function addJournalEntry(token: string, entry: Partial<JournalEntry>) {
  const response = await fetch(`${apiBaseUrl}/pro/journal`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(entry)
  });
  return response.json();
}

export async function runBacktest(strategy: string, range: string): Promise<BacktestResult> {
  const response = await fetch(`${apiBaseUrl}/pro/backtest/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ strategy, range })
  });
  if (!response.ok) throw new Error("Backtesting failed");
  return response.json();
}

export async function fetchSignalById(id: string): Promise<AnalysisResult> {
  const response = await fetch(`${apiBaseUrl}/signals/${id}`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Signal not found");
  return response.json();
}

export type LeaderboardEntry = {
  name: string;
  score: number;
  win_rate: string;
  total_trades: number;
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${apiBaseUrl}/leaderboard`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Failed to load leaderboard");
  return response.json();
}
