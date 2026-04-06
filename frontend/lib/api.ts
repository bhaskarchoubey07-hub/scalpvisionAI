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
