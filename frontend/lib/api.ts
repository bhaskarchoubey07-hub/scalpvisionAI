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

export type AnalysisResult = {
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
    throw new Error(payload.error ?? "Forecasting failed");
  }
  return response.json();
}

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
