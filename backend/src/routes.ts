import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { uploadChartBuffer } from "./services/storage.js";
import { analyzeChart, analyzeTicker } from "./services/ai.js";
import { pool } from "./db.js";
import { requireAuth } from "./middleware/auth.js";
import { fetchMarketOverview, fetchMarketQuote, fetchYahooCandles } from "./services/marketData.js";
import { createAuthToken, createUser, verifyUser } from "./services/auth.js";
import { runBacktest } from "./services/backtesting.js";


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

  // Upload chart — returns a data URL (base64) so AI can read the image directly
  router.post("/upload-chart", upload.single("chart"), asyncHandler(async (request, response) => {
    if (!request.file) {
      return response.status(400).json({ error: "Chart image is required" });
    }
    const mimeType = request.file.mimetype;
    const base64 = request.file.buffer.toString("base64");
    const imageUrl = `data:${mimeType};base64,${base64}`;
    return response.json({ success: true, imageUrl, fileName: request.file.originalname });
  }));

  // ─── Analyze chart — image + optional ticker ───
  // Now self-contained: runs entirely in Node.js, no Python dependency
  router.post("/analyze-chart", asyncHandler(async (request, response) => {
    const schema = z.object({
      imageUrl: z.string().min(1).optional(),
      market: z.enum(["stock", "crypto", "indian-stock", "forex"]).default("stock"),
      symbol: z.string().optional(),
      timeframe: z.string().optional()
    });
    const payload = schema.parse(request.body);

    if (!payload.symbol) {
      return response.status(400).json({
        error: "Symbol is required for analysis. Please enter a ticker symbol (e.g., RELIANCE.NS, AAPL, BTCUSDT)."
      });
    }

    try {
      const result = await analyzeChart({
        imageUrl: payload.imageUrl,
        market: payload.market,
        symbol: payload.symbol,
        timeframe: payload.timeframe,
      });
      return response.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      console.error("Analysis error:", message);
      return response.status(500).json({ error: message });
    }
  }));

  // ─── NEW: Ticker-only analysis (no image needed) ───
  router.post("/analyze-ticker", asyncHandler(async (request, response) => {
    const schema = z.object({
      symbol: z.string().min(1),
      market: z.enum(["stock", "crypto", "indian-stock", "forex"]).default("indian-stock"),
    });
    const { symbol, market } = schema.parse(request.body);

    try {
      const result = await analyzeTicker(symbol, market);
      return response.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      console.error("Ticker analysis error:", message);
      return response.status(500).json({ error: message });
    }
  }));

  router.get("/signals", asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      "SELECT id, market, direction, entry_price, stop_loss, take_profit, risk_reward, confidence, summary, created_at FROM signals ORDER BY created_at DESC LIMIT 20"
    );
    return response.json(rows);
  }));

  router.get("/signals/:id", asyncHandler(async (request, response) => {
    const { rows } = await pool.query(
      "SELECT * FROM signals WHERE id = $1",
      [request.params.id]
    );
    if (!rows.length) return response.status(404).json({ error: "Signal not found" });
    return response.json(rows[0]);
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

  // --- PRO LABORATORY ---
  router.get("/pro/signals", asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      "SELECT * FROM signals WHERE confidence >= 70 ORDER BY created_at DESC LIMIT 50"
    );
    return response.json(rows);
  }));

  router.get("/pro/journal", requireAuth, asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      "SELECT * FROM trade_journal WHERE user_id = $1 ORDER BY trade_date DESC",
      [response.locals.user.sub]
    );
    return response.json(rows);
  }));

  router.post("/pro/journal", requireAuth, asyncHandler(async (request, response) => {
    const schema = z.object({
      asset_symbol: z.string(),
      market: supportedMarketSchema,
      direction: z.enum(["long", "short"]),
      pnl: z.number().optional(),
      outcome: z.enum(["win", "loss", "breakeven"]).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      trade_date: z.string().optional()
    });
    const payload = schema.parse(request.body);
    const { rows } = await pool.query(
      `INSERT INTO trade_journal (user_id, asset_symbol, market, direction, pnl, outcome, notes, tags, trade_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        response.locals.user.sub,
        payload.asset_symbol,
        payload.market,
        payload.direction,
        payload.pnl ?? 0,
        payload.outcome ?? "breakeven",
        payload.notes ?? "",
        payload.tags ?? [],
        payload.trade_date ?? new Date().toISOString()
      ]
    );
    return response.status(201).json(rows[0]);
  }));

  router.post("/pro/backtest/run", asyncHandler(async (request, response) => {
    const schema = z.object({
      strategy: z.string(),
      range: z.string(),
      initial_capital: z.number().default(10000)
    });
    const { strategy, range, initial_capital } = schema.parse(request.body);
    
    // Default to a sane ticker if we don't have one in context (usually backtests are on a specific symbol)
    // For now, let's use RELIANCE.NS as default for the simulation
    const symbol = "RELIANCE.NS"; 
    
    const result = await runBacktest(symbol, range, initial_capital);
    return response.json(result);

  }));

  router.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ error: "Invalid request", details: error.flatten() });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error";
    return response.status(500).json({ error: message });
  });

  // --- INDIAN MARKET ---
  router.get("/market/indian-stocks/search", asyncHandler(async (request, response) => {
    const q = request.query.q as string;
    if (!q || q.length < 2) return response.json([]);

    const { rows } = await pool.query(
      `SELECT symbol, yahoo_symbol, company_name, sector, industry, exchange 
       FROM indian_stocks 
       WHERE (symbol ILIKE $1 OR company_name ILIKE $1) 
       ORDER BY company_name ASC LIMIT 10`,
      [`%${q}%`]
    );
    return response.json(rows);
  }));

  router.get("/market/indian-stocks/popular", asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      `SELECT symbol, yahoo_symbol, company_name, sector, industry, exchange 
       FROM indian_stocks 
       WHERE yahoo_symbol IN ('RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS', 'MARUTI.NS', 'ASIANPAINT.NS', 'WIPRO.NS')
       ORDER BY company_name ASC`
    );
    return response.json(rows);
  }));

  // --- PORTFOLIOS ---
  router.get("/portfolios", requireAuth, asyncHandler(async (_request, response) => {
    const { rows } = await pool.query(
      "SELECT id, name, description, created_at FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC",
      [response.locals.user.sub]
    );
    
    const portfolios = await Promise.all(rows.map(async (p) => {
      const { rows: holdings } = await pool.query(
        "SELECT id, symbol, market, quantity, avg_buy_price, added_at FROM portfolio_holdings WHERE portfolio_id = $1",
        [p.id]
      );
      return { ...p, holdings };
    }));
    
    return response.json(portfolios);
  }));

  router.post("/portfolios", requireAuth, asyncHandler(async (request, response) => {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional()
    });
    const { name, description } = schema.parse(request.body);
    const { rows } = await pool.query(
      "INSERT INTO portfolios (user_id, name, description) VALUES ($1, $2, $3) RETURNING *",
      [response.locals.user.sub, name, description || null]
    );
    return response.status(201).json(rows[0]);
  }));

  router.post("/portfolios/:id/holdings", requireAuth, asyncHandler(async (request, response) => {
    const schema = z.object({
      symbol: z.string().min(1),
      market: z.enum(["stock", "crypto", "indian-stock", "forex"]),
      quantity: z.number().positive(),
      avgBuyPrice: z.number().positive()
    });
    const payload = schema.parse(request.body);
    
    const { rows } = await pool.query(
      "INSERT INTO portfolio_holdings (portfolio_id, symbol, market, quantity, avg_buy_price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [request.params.id, payload.symbol, payload.market, payload.quantity, payload.avgBuyPrice]
    );
    return response.status(201).json(rows[0]);
  }));

  router.delete("/portfolios/holdings/:id", requireAuth, asyncHandler(async (request, response) => {
    await pool.query(
      "DELETE FROM portfolio_holdings WHERE id = $1 AND portfolio_id IN (SELECT id FROM portfolios WHERE user_id = $2)",
      [request.params.id, response.locals.user.sub]
    );
    return response.status(204).send();
  }));

  // --- FORECASTING (self-contained, no Python dependency) ---
  router.post("/market/forecast", asyncHandler(async (request, response) => {
    const schema = z.object({
      symbol: z.string().min(1),
      market: z.enum(["stock", "crypto", "indian-stock", "forex"]).default("indian-stock")
    });
    const { symbol, market } = schema.parse(request.body);
    
    const candles = await fetchYahooCandles(symbol, "5y", "1wk");
    
    if (candles.length < 20) {
      return response.status(400).json({ error: "Insufficient historical data for forecasting." });
    }

    const historical: { date: string; price: number; days: number }[] = candles.map((c, i) => ({
      date: new Date(c.time * 1000).toISOString().split('T')[0],
      price: c.close,
      days: i
    }));

    const x = historical.map(h => h.days);
    const y = historical.map(h => h.price);
    const coeffs = polyfit(x, y, 3);

    const step = Math.max(1, Math.floor(historical.length / 100));
    const points: { date: string; price: number; is_forecast: boolean }[] = [];
    for (let i = 0; i < historical.length; i += step) {
      points.push({ date: historical[i].date, price: historical[i].price, is_forecast: false });
    }
    const lastH = historical[historical.length - 1];
    if (points[points.length - 1].date !== lastH.date) {
      points.push({ date: lastH.date, price: lastH.price, is_forecast: false });
    }

    const lastDay = x[x.length - 1];
    const lastDate = new Date(lastH.date);
    const floorPrice = Math.min(...y) * 0.2;
    
    for (let m = 1; m <= 60; m++) {
      const futureDay = lastDay + (m * 30.4);
      let forecastPrice = polyeval(coeffs, futureDay);
      forecastPrice = Math.max(floorPrice, forecastPrice);
      
      const fDate = new Date(lastDate);
      fDate.setMonth(fDate.getMonth() + m);
      
      points.push({
        date: fDate.toISOString().split('T')[0],
        price: +forecastPrice.toFixed(2),
        is_forecast: true
      });
    }

    const startForecast = y[y.length - 1];
    const endForecast = points[points.length - 1].price;
    const trend = endForecast > startForecast * 1.05 ? "bullish" : endForecast < startForecast * 0.95 ? "bearish" : "neutral";
    
    let narrative = "";
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
      const aiRes = await fetch(`${aiServiceUrl}/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, historical_data: historical.map(h => ({ date: h.date, price: h.price })), forecast_years: 5 }),
        signal: AbortSignal.timeout(5000)
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        narrative = (aiData as { narrative?: string }).narrative || "";
      }
    } catch { /* AI service not available, use fallback */ }
    
    if (!narrative) {
      const changePercent = ((endForecast - startForecast) / startForecast * 100).toFixed(1);
      narrative = `Based on polynomial trend analysis of ${symbol.replace('.NS', '').replace('.BO', '')}'s historical price data, the model projects a ${trend} trajectory over the next 60 months. ` +
        `Current price of ₹${startForecast.toFixed(2)} is projected to move to ₹${endForecast.toFixed(2)} (${+changePercent > 0 ? '+' : ''}${changePercent}%). ` +
        `This projection uses 3rd-degree polynomial regression fitted on ${candles.length} weekly data points spanning 5 years. ` +
        `Note: This is a mathematical projection, not investment advice. Actual prices are influenced by earnings, macro conditions, and market sentiment.`;
    }

    return response.json({
      points,
      narrative,
      confidence_score: 0.72,
      trend
    });
  }));

  // Helper: Polynomial fit (least squares, degree n)
  function polyfit(x: number[], y: number[], degree: number): number[] {
    const n = x.length;
    const size = degree + 1;
    const matrix: number[][] = [];
    const rhs: number[] = [];
    
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      rhs[i] = 0;
      for (let j = 0; j < size; j++) {
        matrix[i][j] = 0;
        for (let k = 0; k < n; k++) {
          matrix[i][j] += Math.pow(x[k], i + j);
        }
      }
      for (let k = 0; k < n; k++) {
        rhs[i] += y[k] * Math.pow(x[k], i);
      }
    }
    
    for (let i = 0; i < size; i++) {
      let maxRow = i;
      for (let k = i + 1; k < size; k++) {
        if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) maxRow = k;
      }
      [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
      [rhs[i], rhs[maxRow]] = [rhs[maxRow], rhs[i]];
      
      for (let k = i + 1; k < size; k++) {
        const c = matrix[k][i] / matrix[i][i];
        for (let j = i; j < size; j++) {
          matrix[k][j] -= c * matrix[i][j];
        }
        rhs[k] -= c * rhs[i];
      }
    }
    
    const coeffs = new Array(size).fill(0);
    for (let i = size - 1; i >= 0; i--) {
      coeffs[i] = rhs[i];
      for (let j = i + 1; j < size; j++) {
        coeffs[i] -= matrix[i][j] * coeffs[j];
      }
      coeffs[i] /= matrix[i][i];
    }
    return coeffs;
  }

  function polyeval(coeffs: number[], x: number): number {
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) {
      result += coeffs[i] * Math.pow(x, i);
    }
    return result;
  }


  // --- AI ADVISOR ---
  router.post("/ai-advisor", async (req: Request, res: Response) => {
    try {
      const { question, history, context } = req.body;
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

      const response = await fetch(`${aiServiceUrl}/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, context })
      });

      if (!response.ok) {
        throw new Error(`AI Service returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Advisor Error:", error);
      res.status(500).json({ error: "Failed to reach AI Advisor" });
    }
  });

  return router;
}
