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

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
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

// In-Memory cache fallback when Redis is offline
const memoryCache = new Map<string, { value: any; expires: number }>();

async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    }
  } catch {}
  
  const local = memoryCache.get(key);
  if (local && local.expires > Date.now()) {
    return local.value as T;
  }
  return null;
}

async function setCached<T>(key: string, value: T, ttlSec = 15) {
  try {
    if (redis) {
      await redis.set(key, JSON.stringify(value), "EX", ttlSec);
    }
  } catch {}
  memoryCache.set(key, { value, expires: Date.now() + ttlSec * 1000 });
}

// Global rate limit queue: ensures 100ms gap between outgoing external requests
let lastRequestTime = 0;
async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 100) {
    await new Promise(r => setTimeout(r, 100 - timeSinceLast));
  }
  lastRequestTime = Date.now();
}

async function fetchWithRetry(url: string, headers?: Record<string, string>, retries = 3, delay = 1000): Promise<Response> {
  await enforceRateLimit();
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

function normalizeYahooSymbol(symbol: string) {
  return symbol.toUpperCase().trim();
}

function normalizeCryptoSymbol(symbol: string) {
  return symbol.replace("/", "").replace("-", "").toUpperCase().trim();
}

// --- Quote Providers ---

async function fetchTwelveDataQuote(symbol: string, market: MarketType): Promise<MarketQuote> {
  const key = process.env.TWELVE_DATA_API_KEY || config.twelveDataApiKey;
  if (!key) throw new Error("No Twelve Data API key");
  const response = await fetchWithRetry(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Twelve Data failed: ${response.status}`);
  const data = await response.json() as any;
  if (data.code) throw new Error(data.message || "Twelve Data error");
  return {
    symbol: data.symbol || symbol,
    market,
    price: Number(data.close || 0),
    changePercent: Number(data.percent_change || 0),
    changeValue: Number(data.change || 0),
    currency: data.currency || "USD",
    source: "Twelve Data",
    asOf: data.datetime || new Date().toISOString()
  };
}

async function fetchPolygonQuote(symbol: string, market: MarketType): Promise<MarketQuote> {
  const key = process.env.POLYGON_API_KEY;
  if (!key) throw new Error("No Polygon API key");
  const polygonSymbol = symbol.replace("=X", "").replace("/", "");
  const response = await fetchWithRetry(`https://api.polygon.io/v2/last/trade/${encodeURIComponent(polygonSymbol)}?apiKey=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Polygon failed: ${response.status}`);
  const data = await response.json() as any;
  const price = data.results?.p || 0;
  return {
    symbol,
    market,
    price,
    changePercent: 0,
    changeValue: 0,
    currency: "USD",
    source: "Polygon",
    asOf: new Date(data.results?.t || Date.now()).toISOString()
  };
}

async function fetchAlphaVantageQuote(symbol: string, market: MarketType): Promise<MarketQuote> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("No Alpha Vantage API key");
  const response = await fetchWithRetry(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Alpha Vantage failed: ${response.status}`);
  const data = await response.json() as any;
  const quote = data["Global Quote"];
  if (!quote || !quote["05. price"]) throw new Error("Alpha Vantage limit or invalid symbol");
  return {
    symbol,
    market,
    price: Number(quote["05. price"]),
    changePercent: Number(quote["10. change percent"].replace("%", "")),
    changeValue: Number(quote["09. change"]),
    currency: "USD",
    source: "Alpha Vantage",
    asOf: new Date().toISOString()
  };
}

async function fetchFinnhubQuote(symbol: string, market: MarketType): Promise<MarketQuote> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("No Finnhub API key");
  const response = await fetchWithRetry(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Finnhub failed: ${response.status}`);
  const data = await response.json() as any;
  if (data.c === 0) throw new Error("Finnhub returned empty quote");
  return {
    symbol,
    market,
    price: Number(data.c || 0),
    changePercent: Number(data.dp || 0),
    changeValue: Number(data.d || 0),
    currency: "USD",
    source: "Finnhub",
    asOf: new Date().toISOString()
  };
}

async function fetchYahooQuote(symbol: string, market: MarketType): Promise<MarketQuote> {
  const normalized = normalizeYahooSymbol(symbol);
  const response = await fetchWithRetry(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?range=1d&interval=1m`,
    { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  );
  if (!response.ok) throw new Error(`Yahoo failed with status ${response.status}`);
  const payload = await response.json() as any;
  const meta = payload.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`No Yahoo quote for ${normalized}`);
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
  const changeValue = meta.regularMarketPrice - prevClose;
  const changePercent = prevClose === 0 ? 0 : (changeValue / prevClose) * 100;
  return {
    symbol: meta.symbol || normalized,
    market,
    price: meta.regularMarketPrice,
    changePercent,
    changeValue,
    currency: meta.currency || (market === "indian-stock" ? "INR" : "USD"),
    source: "Yahoo Finance",
    asOf: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString()
  };
}

async function fetchCryptoQuote(symbol: string): Promise<MarketQuote> {
  const normalized = normalizeCryptoSymbol(symbol);
  const response = await fetchWithRetry(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(normalized)}`);
  if (!response.ok) throw new Error(`Binance failed with status ${response.status}`);
  const payload = await response.json() as any;
  return {
    symbol: payload.symbol,
    market: "crypto",
    price: Number(payload.lastPrice),
    changePercent: Number(payload.priceChangePercent),
    changeValue: Number(payload.priceChange),
    currency: normalized.endsWith("USDT") ? "USDT" : "USD",
    source: "Binance",
    asOf: new Date(payload.closeTime).toISOString()
  };
}

// --- Public Interface ---

export async function fetchMarketQuote(market: MarketType, symbol: string): Promise<MarketQuote> {
  if (market === "crypto") return fetchCryptoQuote(symbol);
  
  const cacheKey = `market:${market}:${symbol.toUpperCase()}`;
  const cached = await getCached<MarketQuote>(cacheKey);
  if (cached) return cached;
  
  const providers = [
    () => fetchTwelveDataQuote(symbol, market),
    () => fetchPolygonQuote(symbol, market),
    () => fetchAlphaVantageQuote(symbol, market),
    () => fetchFinnhubQuote(symbol, market),
    () => fetchYahooQuote(symbol, market)
  ];
  
  for (const provider of providers) {
    try {
      const quote = await provider();
      await setCached(cacheKey, quote, 15);
      return quote;
    } catch (e) {
      console.warn(`Quote provider failed for ${symbol}: ${e instanceof Error ? e.message : e}`);
    }
  }
  
  throw new Error(`All quote providers failed for ${symbol}`);
}

export async function fetchMarketOverview() {
  const [stockResults, cryptoResults, indianResults, forexResults] = await Promise.all([
    Promise.allSettled(defaultSymbols.stock.map((s) => fetchMarketQuote("stock", s))),
    Promise.allSettled(defaultSymbols.crypto.map((s) => fetchCryptoQuote(s))),
    Promise.allSettled(defaultSymbols["indian-stock"].map((s) => fetchMarketQuote("indian-stock", s))),
    Promise.allSettled(defaultSymbols.forex.map((s) => fetchMarketQuote("forex", s)))
  ]);

  return {
    stocks: stockResults.filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === "fulfilled").map(r => r.value),
    crypto: cryptoResults.filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === "fulfilled").map(r => r.value),
    indianStocks: indianResults.filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === "fulfilled").map(r => r.value),
    forex: forexResults.filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === "fulfilled").map(r => r.value),
    stockProvider: "Multi-Source Confluence",
    cryptoProvider: "Binance",
    indianStockProvider: "Yahoo Finance",
    forexProvider: "Yahoo Finance"
  };
}

// --- Candle Fetchers & Fallbacks ---

async function fetchTwelveDataCandles(symbol: string, range: string, interval: string): Promise<Candle[]> {
  const key = process.env.TWELVE_DATA_API_KEY || config.twelveDataApiKey;
  if (!key) throw new Error("No Twelve Data key");
  
  let tdInterval = "1day";
  if (interval === "15m") tdInterval = "15min";
  else if (interval === "60m") tdInterval = "1h";
  
  const response = await fetchWithRetry(`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=250&apikey=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Twelve Data candles failed: ${response.status}`);
  const data = await response.json() as any;
  if (data.code) throw new Error(data.message || "Twelve Data candles error");
  
  const values = data.values || [];
  return values.map((v: any) => ({
    time: Math.floor(new Date(v.datetime).getTime() / 1000),
    open: Number(v.open),
    high: Number(v.high),
    low: Number(v.low),
    close: Number(v.close),
    volume: Number(v.volume || 0)
  })).reverse();
}

async function fetchRawYahooCandles(symbol: string, range: string, interval: string): Promise<Candle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(
    range
  )}&interval=${encodeURIComponent(interval)}&includePrePost=false`;

  const response = await fetchWithRetry(url, {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance candles failed: ${response.status} for ${symbol}`);
  }

  const payload = (await response.json()) as any;
  const result = payload.chart?.result?.[0];
  if (!result) throw new Error(`No chart result returned for ${symbol}`);

  const times = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote || !quote.open || !quote.high || !quote.low || !quote.close) {
    throw new Error("No candle data available");
  }

  const candles: Candle[] = times.map((t: number, idx: number) => ({
    time: t,
    open: quote.open?.[idx] ?? 0,
    high: quote.high?.[idx] ?? 0,
    low: quote.low?.[idx] ?? 0,
    close: quote.close?.[idx] ?? 0,
    volume: quote.volume?.[idx] ?? 0
  }));

  return candles.filter((c) => [c.open, c.high, c.low, c.close].every((n) => Number.isFinite(n)));
}

export async function fetchHistoricalCandles(symbol: string, range = "1mo", interval = "1d"): Promise<Candle[]> {
  const cacheKey = `candles:${symbol}:${range}:${interval}`;
  const cached = await getCached<Candle[]>(cacheKey);
  if (cached) return cached;
  
  const providers = [
    () => fetchRawYahooCandles(symbol, range, interval),
    () => fetchTwelveDataCandles(symbol, range, interval)
  ];
  
  for (const provider of providers) {
    try {
      const candles = await provider();
      await setCached(cacheKey, candles, 60);
      return candles;
    } catch (e) {
      console.warn(`Candle provider failed for ${symbol}: ${e instanceof Error ? e.message : e}`);
    }
  }
  
  throw new Error(`All candle providers failed for ${symbol}`);
}

export async function fetchYahooCandles(symbol: string, range = "1mo", interval = "1d"): Promise<Candle[]> {
  return fetchHistoricalCandles(symbol, range, interval);
}

