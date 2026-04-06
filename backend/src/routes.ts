import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { uploadChartBuffer } from "./services/storage.js";
import { analyzeChart } from "./services/ai.js";
import { pool } from "./db.js";
import { requireAuth } from "./middleware/auth.js";
import { fetchMarketOverview, fetchMarketQuote, fetchYahooCandles } from "./services/marketData.js";
import { createAuthToken, createUser, verifyUser } from "./services/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Only image uploads are allowed"));
    }
    callback(null, true);
  }
});

const analyzeSchema = z.object({
  imageUrl: z.string().url(),
  market: z.enum(["stock", "crypto"]),
  symbol: z.string().optional(),
  timeframe: z.string().optional()
});

const supportedMarketSchema = z.enum(["stock", "crypto", "indian-stock", "forex"]);

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).optional()
});

function asyncHandler(handler: (request: Request, response: Response, next: NextFunction) => Promise<void | Response>) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export function createRouter() {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ ok: true, service: "backend" });
  });

  // ---- Indian Stock Directory ----
  router.get("/indian-stocks", asyncHandler(async (request, response) => {
    const schema = z.object({
      exchange: z.enum(["NSE", "BSE", "NSE,BSE"]).optional(),
      sector:   z.string().optional(),
      limit:    z.coerce.number().min(1).max(500).default(100),
      offset:   z.coerce.number().min(0).default(0)
    });
    const query = schema.parse(request.query);
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.exchange) {
      params.push(query.exchange);
      conditions.push(`exchange = $${params.length}`);
    }
    if (query.sector) {
      params.push(query.sector);
      conditions.push(`sector = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(query.limit, query.offset);
    const { rows } = await pool.query(
      `SELECT id, symbol, yahoo_symbol, company_name, exchange, sector, industry
       FROM indian_stocks ${where}
       ORDER BY company_name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Also get distinct sectors for filter UI
    const { rows: sectors } = await pool.query(
      "SELECT DISTINCT sector FROM indian_stocks WHERE sector IS NOT NULL ORDER BY sector"
    );

    return response.json({ stocks: rows, sectors: sectors.map((s) => s.sector) });
  }));

  router.get("/indian-stocks/search", asyncHandler(async (request, response) => {
    const schema = z.object({ q: z.string().min(1) });
    const { q } = schema.parse(request.query);
    const { rows } = await pool.query(
      `SELECT id, symbol, yahoo_symbol, company_name, exchange, sector, industry
       FROM indian_stocks
       WHERE symbol ILIKE $1
          OR company_name ILIKE $1
          OR yahoo_symbol ILIKE $1
       ORDER BY
         CASE WHEN symbol ILIKE $2 THEN 0
              WHEN company_name ILIKE $2 THEN 1
              ELSE 2 END,
         company_name ASC
       LIMIT 20`,
      [`%${q}%`, `${q}%`]
    );
    return response.json({ results: rows });
  }));

  router.get("/indian-stocks/sectors", asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      `SELECT sector, COUNT(*) AS count
       FROM indian_stocks
       WHERE sector IS NOT NULL
       GROUP BY sector
       ORDER BY sector`
    );
    return response.json({ sectors: rows });
  }));

  router.post("/auth/signup", asyncHandler(async (request, response) => {
    const payload = authSchema.extend({ fullName: z.string().min(2) }).parse(request.body);
    const user = await createUser(payload.email.toLowerCase(), payload.password, payload.fullName);
    const token = createAuthToken(user);
    return response.status(201).json({ token, user });
  }));

  router.post("/auth/login", asyncHandler(async (request, response) => {
    const payload = authSchema.pick({ email: true, password: true }).parse(request.body);
    const user = await verifyUser(payload.email.toLowerCase(), payload.password);
    const token = createAuthToken(user);
    return response.json({ token, user });
  }));

  router.get("/auth/me", requireAuth, asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      "SELECT id, email, full_name, avatar_url FROM users WHERE id = $1",
      [response.locals.user.sub]
    );
    return response.json({ user: rows[0] ?? null });
  }));

  router.get("/market/overview", asyncHandler(async (_request, response) => {
    const overview = await fetchMarketOverview();
    return response.json(overview);
  }));

  router.get("/market/quote/:market/:symbol", asyncHandler(async (request, response) => {
    const schema = z.object({
      market: supportedMarketSchema,
      symbol: z.string().min(1)
    });
    const params = schema.parse(request.params);
    const quote = await fetchMarketQuote(params.market, params.symbol);
    return response.json(quote);
  }));

  router.get("/market/candles", asyncHandler(async (request, response) => {
    const schema = z.object({
      symbol: z.string().min(1),
      range: z.string().optional(),
      interval: z.string().optional()
    });
    const query = schema.parse(request.query);
    const candles = await fetchYahooCandles(query.symbol, query.range ?? "1mo", query.interval ?? "1d");
    return response.json({ symbol: query.symbol, candles });
  }));

  // Upload chart — returns a data URL (base64) so Gemini can read the image directly
  router.post("/upload-chart", upload.single("chart"), asyncHandler(async (request, response) => {
    if (!request.file) {
      return response.status(400).json({ error: "Chart image is required" });
    }
    const mimeType = request.file.mimetype;
    const base64 = request.file.buffer.toString("base64");
    const imageUrl = `data:${mimeType};base64,${base64}`;
    return response.json({ success: true, imageUrl, fileName: request.file.originalname });
  }));

  // Analyze chart — accepts imageUrl (may be a data: URI or https:// URL)
  router.post("/analyze-chart", asyncHandler(async (request, response) => {
    const schema = z.object({
      imageUrl: z.string().min(1),
      market: z.enum(["stock", "crypto", "indian-stock", "forex"]).default("stock"),
      symbol: z.string().optional(),
      timeframe: z.string().optional()
    });
    const payload = schema.parse(request.body);
    const result = await analyzeChart(payload);
    return response.json(result);
  }));

  router.get("/signals", asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      "SELECT id, market, direction, entry_price, stop_loss, take_profit, risk_reward, confidence, summary, created_at FROM signals ORDER BY created_at DESC LIMIT 20"
    );
    return response.json(rows);
  }));

  router.get("/watchlist", requireAuth, asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      "SELECT id, symbol, market, notes, created_at FROM watchlists WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [response.locals.user.sub]
    );
    return response.json(rows);
  }));

  router.post("/watchlist", requireAuth, asyncHandler(async (request, response) => {
    const payload = z.object({
      symbol: z.string().min(1),
      market: supportedMarketSchema,
      notes: z.string().optional()
    }).parse(request.body);

    const existing = await pool.query(
      "SELECT id FROM watchlists WHERE user_id = $1 AND symbol = $2 AND market = $3",
      [response.locals.user.sub, payload.symbol, payload.market]
    );

    if (existing.rowCount) {
      return response.status(200).json({ message: "Already in watchlist" });
    }

    const { rows } = await pool.query(
      "INSERT INTO watchlists (user_id, symbol, market, notes) VALUES ($1, $2, $3, $4) RETURNING id, symbol, market, notes, created_at",
      [response.locals.user.sub, payload.symbol, payload.market, payload.notes ?? null]
    );

    return response.status(201).json(rows[0]);
  }));

  router.delete("/watchlist/:id", requireAuth, asyncHandler(async (request, response) => {
    await pool.query("DELETE FROM watchlists WHERE id = $1 AND user_id = $2", [
      request.params.id,
      response.locals.user.sub
    ]);
    return response.status(204).send();
  }));

  router.post("/user/prediction", requireAuth, asyncHandler(async (request, response) => {
    const schema = z.object({
      signalId: z.string().uuid(),
      outcome: z.enum(["win", "loss", "breakeven"]).optional(),
      pnl: z.number().optional()
    });
    const payload = schema.parse(request.body);

    const { rows } = await pool.query(
      "INSERT INTO predictions (user_id, signal_id, outcome, pnl) VALUES ($1, $2, $3, $4) RETURNING *",
      [response.locals.user.sub, payload.signalId, payload.outcome ?? null, payload.pnl ?? null]
    );

    return response.status(201).json(rows[0]);
  }));

  router.get("/leaderboard", asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      `SELECT COALESCE(u.full_name, 'Anonymous') AS name, le.score, le.win_rate, le.total_trades
       FROM leaderboard_entries le
       LEFT JOIN users u ON u.id = le.user_id
       ORDER BY le.score DESC
       LIMIT 20`
    );
    return response.json(rows);
  }));

  router.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ error: "Invalid request", details: error.flatten() });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error";
    return response.status(500).json({ error: message });
  });

  return router;
}
