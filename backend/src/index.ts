import http from "node:http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { WebSocketServer } from "ws";
import { createRouter } from "./routes.js";
import { config } from "./config.js";
import { redis } from "./cache.js";
import { broadcastSignal } from "./services/liveSignals.js";
import { analyzeTicker } from "./services/ai.js";

const app = express();

app.use(helmet());
const allowedOrigins = config.allowedOrigins.length
  ? config.allowedOrigins
  : [config.frontendUrl, "http://localhost:3000", "https://scalpvision-ai.vercel.app"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60
  })
);

app.use(createRouter());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "connected", message: "Live signal stream connected" }));
});

// Real-time market scanner — rotates through key symbols and broadcasts live signals
const SCAN_SYMBOLS = [
  { symbol: "RELIANCE.NS", market: "indian-stock" },
  { symbol: "TCS.NS", market: "indian-stock" },
  { symbol: "HDFCBANK.NS", market: "indian-stock" },
  { symbol: "INFY.NS", market: "indian-stock" },
  { symbol: "SBIN.NS", market: "indian-stock" },
  { symbol: "ICICIBANK.NS", market: "indian-stock" },
];

let scanIndex = 0;

async function scanAndBroadcast() {
  if (wss.clients.size === 0) return; // No clients, skip scan

  const { symbol, market } = SCAN_SYMBOLS[scanIndex % SCAN_SYMBOLS.length];
  scanIndex++;

  try {
    const result = await analyzeTicker(symbol, market);
    broadcastSignal(wss, {
      type: "live_signal",
      symbol: result.symbol,
      market: result.market,
      direction: result.direction,
      signal: result.signal,
      confidence: result.confidence,
      entry_price: result.entry_price,
      stop_loss: result.stop_loss,
      take_profit: result.take_profit,
      risk_reward: result.risk_reward,
      trend: result.trend,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Live scan failed for ${symbol}:`, err instanceof Error ? err.message : err);
  }
}

async function bootstrap() {
  try {
    if (redis) {
      await redis.connect();
    }
  } catch {
    // Redis is optional during early local setup.
  }

  // Scan every 60 seconds (respectful of Yahoo Finance rate limits)
  setInterval(scanAndBroadcast, 60_000);

  server.listen(config.port, () => {
    console.log(`ScalpVision backend listening on ${config.port}`);
  });
}

bootstrap();
