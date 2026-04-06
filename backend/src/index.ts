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

async function bootstrap() {
  try {
    await redis.connect();
  } catch {
    // Redis is optional during early local setup.
  }

  setInterval(() => {
    broadcastSignal(wss, {
      market: "crypto",
      symbol: "BTC/USDT",
      confidence: 83,
      direction: "long"
    });
  }, 15000);

  server.listen(config.port, () => {
    console.log(`ScalpVision backend listening on ${config.port}`);
  });
}

bootstrap();
