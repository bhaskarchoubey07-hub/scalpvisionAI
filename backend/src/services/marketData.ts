import { config } from "../config.js";
import { redis } from "../cache.js";

export type MarketType = "stock" | "crypto" | "indian-stock" | "forex";

export type MarketQuote = {
  symbol: string;
  market: MarketType;
  price: number;
  changePercent: number;
  changeValue: number;
  currency: string;
  source: string;
  asOf: string;
};

const defaultSymbols = {
  stock: ["AAPL", "NVDA", "TSLA", "MSFT"],
  crypto: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"],
  "indian-stock": [
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "SBIN.NS",
    "KOTAKBANK.NS",
    "BHARTIARTL.NS",
    "LT.NS",
    "ITC.NS",
    "ASIANPAINT.NS",
    "MARUTI.NS"
  ],
  forex: ["EURUSD=X", "GBPUSD=X", "USDINR=X", "USDJPY=X"]
} satisfies Record<MarketType, string[]>;

async function getCachedQuote(key: string) {
  try {
    if (!redis) return null;
    const cached = await redis.get(key);
    return cached ? (JSON.parse(cached) as MarketQuote) : null;
  } catch {
    return null;
  }
}

async function setCachedQuote(key: string, value: MarketQuote) {
  try {
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), "EX", 15);
  } catch {
    // Cache is optional for local development.
  }
}

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

function normalizeYahooSymbol(symbol: string) {
  return symbol.toUpperCase().trim();
}

async function fetchYahooQuote(symbol: string, market: "stock" | "indian-stock" | "forex"): Promise<MarketQuote> {
  const normalized = normalizeYahooSymbol(symbol);
  const cacheKey = `market:${market}:${normalized}`;
  const cached = await getCachedQuote(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?range=1d&interval=1m`,
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; ScalpVision/1.0; +https://scalpvision.io)" } }
  );
  if (!response.ok) {
    throw new Error(`Yahoo Finance failed with status ${response.status} for ${normalized}`);
  }

  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          symbol?: string;
          currency?: string;
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          previousClose?: number;
          regularMarketTime?: number;
        };
      }>;
    };
  };

  const meta = payload.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) {
    throw new Error(`No stock quote available for ${normalized}`);
  }

  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
  const changeValue = meta.regularMarketPrice - previousClose;
  const changePercent = previousClose === 0 ? 0 : (changeValue / previousClose) * 100;

  const quote: MarketQuote = {
    symbol: meta.symbol ?? normalized,
    market,
    price: meta.regularMarketPrice,
    changePercent,
    changeValue,
    currency: meta.currency ?? (market === "indian-stock" ? "INR" : "USD"),
    source: "Yahoo Finance fallback",
    asOf: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString()
  };

  await setCachedQuote(cacheKey, quote);
  return quote;
}

async function fetchStockQuote(symbol: string): Promise<MarketQuote> {
  const normalized = normalizeYahooSymbol(symbol);
  const cacheKey = `market:stock:${normalized}`;
  const cached = await getCachedQuote(cacheKey);
  if (cached) return cached;

  if (config.twelveDataApiKey) {
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(normalized)}&apikey=${encodeURIComponent(config.twelveDataApiKey)}`
    );
    if (!response.ok) {
      throw new Error(`Twelve Data request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      code?: number;
      message?: string;
      symbol?: string;
      close?: string;
      previous_close?: string;
      percent_change?: string;
      change?: string;
      currency?: string;
      datetime?: string;
    };

    if (payload.code) {
      throw new Error(payload.message ?? "Unable to load stock quote");
    }

    const quote: MarketQuote = {
      symbol: payload.symbol ?? normalized,
      market: "stock",
      price: Number(payload.close ?? 0),
      changePercent: Number(payload.percent_change ?? 0),
      changeValue: Number(payload.change ?? 0),
      currency: payload.currency ?? "USD",
      source: "Twelve Data",
      asOf: payload.datetime ?? new Date().toISOString()
    };

    await setCachedQuote(cacheKey, quote);
    return quote;
  }

  return fetchYahooQuote(symbol, "stock");
}

function normalizeCryptoSymbol(symbol: string) {
  return symbol.replace("/", "").replace("-", "").toUpperCase().trim();
}

async function fetchCryptoQuote(symbol: string): Promise<MarketQuote> {
  const normalized = normalizeCryptoSymbol(symbol);
  const cacheKey = `market:crypto:${normalized}`;
  const cached = await getCachedQuote(cacheKey);
  if (cached) return cached;

  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(normalized)}`);
  if (!response.ok) {
    throw new Error(`Binance request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    symbol: string;
    lastPrice: string;
    priceChange: string;
    priceChangePercent: string;
    closeTime: number;
  };

  const quote: MarketQuote = {
    symbol: payload.symbol,
    market: "crypto",
    price: Number(payload.lastPrice),
    changePercent: Number(payload.priceChangePercent),
    changeValue: Number(payload.priceChange),
    currency: normalized.endsWith("USDT") ? "USDT" : "USD",
    source: "Binance",
    asOf: new Date(payload.closeTime).toISOString()
  };

  await setCachedQuote(cacheKey, quote);
  return quote;
}

export async function fetchMarketQuote(market: MarketType, symbol: string) {
  if (market === "stock") return fetchStockQuote(symbol);
  if (market === "crypto") return fetchCryptoQuote(symbol);
  if (market === "indian-stock") return fetchYahooQuote(symbol, "indian-stock");
  return fetchYahooQuote(symbol, "forex");
}

function settled<T>(results: PromiseSettledResult<T>[]): T[] {
  return results
    .filter((r): r is PromiseFulfilledResult<T> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function fetchMarketOverview() {
  const [stockResults, cryptoResults, indianResults, forexResults] = await Promise.all([
    Promise.allSettled(defaultSymbols.stock.map((s) => fetchStockQuote(s))),
    Promise.allSettled(defaultSymbols.crypto.map((s) => fetchCryptoQuote(s))),
    Promise.allSettled(defaultSymbols["indian-stock"].map((s) => fetchYahooQuote(s, "indian-stock"))),
    Promise.allSettled(defaultSymbols.forex.map((s) => fetchYahooQuote(s, "forex")))
  ]);

  return {
    stocks: settled(stockResults),
    crypto: settled(cryptoResults),
    indianStocks: settled(indianResults),
    forex: settled(forexResults),
    stockProvider: config.twelveDataApiKey ? "Twelve Data" : "Yahoo Finance",
    cryptoProvider: "Binance",
    indianStockProvider: "Yahoo Finance",
    forexProvider: "Yahoo Finance"
  };
}

export async function fetchYahooCandles(symbol: string, range = "1mo", interval = "1d"): Promise<Candle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(
    range
  )}&interval=${encodeURIComponent(interval)}&includePrePost=false`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ScalpVision/1.0; +https://scalpvision.io)" }
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance candles failed: ${response.status} for ${symbol}`);
  }

  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
            close?: (number | null)[];
          }>;
        };
      }>;
    };
  };

  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(`No chart result returned for ${symbol}`);
  }

  const times = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote || !quote.open || !quote.high || !quote.low || !quote.close) {
    throw new Error("No candle data available");
  }

  const candles: Candle[] = times.map((t, idx) => ({
    time: t,
    open: quote.open?.[idx] ?? 0,
    high: quote.high?.[idx] ?? 0,
    low: quote.low?.[idx] ?? 0,
    close: quote.close?.[idx] ?? 0
  }));

  return candles.filter((c) => [c.open, c.high, c.low, c.close].every((n) => Number.isFinite(n)));
}
