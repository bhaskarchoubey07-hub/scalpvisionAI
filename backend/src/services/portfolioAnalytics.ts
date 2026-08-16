import { fetchYahooCandles, type Candle } from "./marketData.js";

export type PortfolioHolding = {
  symbol: string;
  qty: number;
  avgPrice: number;
  market: string;
  sector?: string;
};

export type PortfolioAnalytics = {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  treynorRatio: number;
  beta: number;
  alpha: number;
  maxDrawdown: number;
  diversificationScore: number;
  riskScore: number;
  sectorAllocation: { sector: string; weight: number }[];
  correlationMatrix: { symbol1: string; symbol2: string; correlation: number }[];
  suggestions: string[];
};

export async function calculatePortfolioAnalytics(
  holdings: PortfolioHolding[],
  riskFreeRate = 0.05
): Promise<PortfolioAnalytics> {
  if (!holdings || holdings.length === 0) {
    return createEmptyAnalytics();
  }

  // 1. Fetch current prices & align weights
  const symbols = holdings.map((h) => h.symbol);
  const prices: Record<string, number> = {};
  
  // Fetch recent quotes to get latest market values
  const candlePromises = holdings.map(async (h) => {
    try {
      const candles = await fetchYahooCandles(h.symbol, "1y", "1d");
      return { symbol: h.symbol, candles };
    } catch {
      return { symbol: h.symbol, candles: [] as Candle[] };
    }
  });

  const results = await Promise.all(candlePromises);
  const candlesMap: Record<string, Candle[]> = {};
  
  for (const r of results) {
    if (r.candles.length > 0) {
      candlesMap[r.symbol] = r.candles;
      prices[r.symbol] = r.candles[r.candles.length - 1].close;
    } else {
      const holding = holdings.find((h) => h.symbol === r.symbol)!;
      prices[r.symbol] = holding.avgPrice;
    }
  }

  // Calculate weights
  let totalValue = 0;
  const values: Record<string, number> = {};
  for (const h of holdings) {
    const val = h.qty * (prices[h.symbol] || h.avgPrice);
    values[h.symbol] = val;
    totalValue += val;
  }

  if (totalValue === 0) return createEmptyAnalytics();

  const weights: Record<string, number> = {};
  for (const h of holdings) {
    weights[h.symbol] = values[h.symbol] / totalValue;
  }

  // 2. Fetch Market index for Beta calculations
  // S&P 500 (^GSPC) is used as global equity benchmark
  let marketCandles: Candle[] = [];
  try {
    marketCandles = await fetchYahooCandles("^GSPC", "1y", "1d");
  } catch {
    // skip
  }

  // 3. Align returns
  const dates = new Set<number>();
  Object.values(candlesMap).forEach((cList) => {
    cList.forEach((c) => dates.add(c.time));
  });
  if (marketCandles.length > 0) {
    marketCandles.forEach((c) => dates.add(c.time));
  }

  const sortedDates = Array.from(dates).sort((a, b) => a - b);
  
  // Calculate daily returns for each asset
  const assetReturns: Record<string, number[]> = {};
  symbols.forEach((sym) => {
    assetReturns[sym] = [];
  });
  const mktReturns: number[] = [];

  const getPriceAtTime = (cList: Candle[], time: number): number | null => {
    // Find closest price at or before time
    const cand = cList.find((c) => c.time === time);
    return cand ? cand.close : null;
  };

  for (let i = 1; i < sortedDates.length; i++) {
    const tPrev = sortedDates[i - 1];
    const tCurr = sortedDates[i];

    symbols.forEach((sym) => {
      const cList = candlesMap[sym];
      if (cList && cList.length > 1) {
        const pPrev = getPriceAtTime(cList, tPrev);
        const pCurr = getPriceAtTime(cList, tCurr);
        if (pPrev && pCurr && pPrev > 0) {
          assetReturns[sym].push((pCurr - pPrev) / pPrev);
        } else {
          assetReturns[sym].push(0);
        }
      } else {
        assetReturns[sym].push(0);
      }
    });

    if (marketCandles.length > 1) {
      const pPrev = getPriceAtTime(marketCandles, tPrev);
      const pCurr = getPriceAtTime(marketCandles, tCurr);
      if (pPrev && pCurr && pPrev > 0) {
        mktReturns.push((pCurr - pPrev) / pPrev);
      } else {
        mktReturns.push(0);
      }
    } else {
      mktReturns.push(0);
    }
  }

  const numTradingDays = assetReturns[symbols[0]]?.length || 0;
  if (numTradingDays < 5) return createEmptyAnalytics();

  // 4. Calculate Portfolio expected return & volatility
  let portfolioExpectedReturn = 0;
  const assetExpectedReturns: Record<string, number> = {};
  const assetVolatilities: Record<string, number> = {};

  symbols.forEach((sym) => {
    const rets = assetReturns[sym];
    const avgDaily = rets.reduce((a, b) => a + b, 0) / rets.length;
    // Annualize (252 trading days)
    const annRet = avgDaily * 252;
    assetExpectedReturns[sym] = annRet;
    portfolioExpectedReturn += annRet * weights[sym];

    // Standard deviation of daily returns
    const variance = rets.map((r) => Math.pow(r - avgDaily, 2)).reduce((a, b) => a + b, 0) / rets.length;
    assetVolatilities[sym] = Math.sqrt(variance) * Math.sqrt(252);
  });

  // Portfolio Variance using covariance matrix
  let portfolioVariance = 0;
  const correlationMatrix: PortfolioAnalytics["correlationMatrix"] = [];

  for (let i = 0; i < symbols.length; i++) {
    for (let j = 0; j < symbols.length; j++) {
      const sym1 = symbols[i];
      const sym2 = symbols[j];
      const rets1 = assetReturns[sym1];
      const rets2 = assetReturns[sym2];
      
      const avg1 = rets1.reduce((a, b) => a + b, 0) / rets1.length;
      const avg2 = rets2.reduce((a, b) => a + b, 0) / rets2.length;

      let cov = 0;
      for (let k = 0; k < numTradingDays; k++) {
        cov += (rets1[k] - avg1) * (rets2[k] - avg2);
      }
      cov = cov / numTradingDays; // Daily covariance
      
      const annCov = cov * 252; // Annualized covariance
      portfolioVariance += weights[sym1] * weights[sym2] * annCov;

      // Correlation calculation for matrix (only compute upper triangle & diagonal)
      if (i <= j) {
        const std1 = Math.sqrt(rets1.map((r) => Math.pow(r - avg1, 2)).reduce((a, b) => a + b, 0) / rets1.length);
        const std2 = Math.sqrt(rets2.map((r) => Math.pow(r - avg2, 2)).reduce((a, b) => a + b, 0) / rets2.length);
        const corr = std1 * std2 > 0 ? cov / (std1 * std2) : 0;
        
        correlationMatrix.push({
          symbol1: sym1,
          symbol2: sym2,
          correlation: +corr.toFixed(3)
        });
      }
    }
  }

  const portfolioVolatility = Math.sqrt(Math.max(0, portfolioVariance));

  // 5. Calculate Beta & Alpha
  let portfolioBeta = 0;
  const assetBetas: Record<string, number> = {};
  const mktVar = mktReturns.map((r) => Math.pow(r - (mktReturns.reduce((a,b)=>a+b,0)/mktReturns.length), 2)).reduce((a,b)=>a+b,0) / mktReturns.length;
  const mktAvg = mktReturns.reduce((a, b) => a + b, 0) / mktReturns.length;

  symbols.forEach((sym) => {
    const rets = assetReturns[sym];
    const avg = rets.reduce((a, b) => a + b, 0) / rets.length;
    
    let cov = 0;
    for (let k = 0; k < numTradingDays; k++) {
      cov += (rets[k] - avg) * (mktReturns[k] - mktAvg);
    }
    cov = cov / numTradingDays;
    
    const beta = mktVar > 0 ? cov / mktVar : 1.0;
    assetBetas[sym] = beta;
    portfolioBeta += beta * weights[sym];
  });

  const marketAnnualReturn = mktAvg * 252;
  const expectedCAPM = riskFreeRate + portfolioBeta * (marketAnnualReturn - riskFreeRate);
  const portfolioAlpha = portfolioExpectedReturn - expectedCAPM;

  // 6. Ratios (Sharpe, Sortino, Treynor)
  const excessReturn = portfolioExpectedReturn - riskFreeRate;
  const sharpeRatio = portfolioVolatility > 0 ? excessReturn / portfolioVolatility : 0;

  // Downside deviation
  let downsideSum = 0;
  for (let k = 0; k < numTradingDays; k++) {
    let dailyPortfolioReturn = 0;
    symbols.forEach((sym) => {
      dailyPortfolioReturn += (assetReturns[sym][k] || 0) * weights[sym];
    });
    // Risk-free rate adjusted daily
    const excess = dailyPortfolioReturn - (riskFreeRate / 252);
    if (excess < 0) {
      downsideSum += Math.pow(excess, 2);
    }
  }
  const downsideDev = Math.sqrt(downsideSum / numTradingDays) * Math.sqrt(252);
  const sortinoRatio = downsideDev > 0 ? excessReturn / downsideDev : sharpeRatio;
  
  const treynorRatio = portfolioBeta !== 0 ? excessReturn / portfolioBeta : sharpeRatio;

  // 7. Max Drawdown
  let cumReturn = 1.0;
  let peak = 1.0;
  let maxDD = 0;
  
  for (let k = 0; k < numTradingDays; k++) {
    let dailyPortfolioReturn = 0;
    symbols.forEach((sym) => {
      dailyPortfolioReturn += (assetReturns[sym][k] || 0) * weights[sym];
    });
    cumReturn *= (1.0 + dailyPortfolioReturn);
    if (cumReturn > peak) peak = cumReturn;
    const dd = (peak - cumReturn) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  // 8. Diversification & Risk Score
  const weightedSumVols = symbols.reduce((sum, sym) => sum + weights[sym] * assetVolatilities[sym], 0);
  const diversificationScore = weightedSumVols > 0 ? 1 - (portfolioVolatility / weightedSumVols) : 0.0;
  
  // Risk Score: 1 (very low) to 100 (high) based on portfolio volatility
  // High equity portfolios typically have volatilities around 15-25%
  const riskScore = Math.max(1, Math.min(100, Math.round(portfolioVolatility * 350)));

  // 9. Sector Allocation
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    const sec = h.sector || "Other";
    sectorMap[sec] = (sectorMap[sec] || 0) + weights[h.symbol];
  });
  const sectorAllocation = Object.entries(sectorMap).map(([sector, w]) => ({
    sector,
    weight: +w.toFixed(3)
  }));

  // 10. Suggestions
  const suggestions: string[] = [];
  if (portfolioBeta > 1.3) {
    suggestions.push(`High Beta exposure (${portfolioBeta.toFixed(2)}) detected. Consider adding defensive assets (e.g., consumer staples, utilities, gold) to dampen market volatility.`);
  }
  if (portfolioVolatility > 0.25) {
    suggestions.push(`Annualized volatility is high (${(portfolioVolatility * 100).toFixed(1)}%). Rebalance your allocation towards lower-variance bonds or defensive index ETFs to stabilize returns.`);
  }
  if (diversificationScore < 0.15 && holdings.length > 2) {
    suggestions.push(`Low diversification benefit (${(diversificationScore * 100).toFixed(0)}%). Your holdings are highly correlated. Consider diversifying into non-correlated asset classes or different geographic sectors.`);
  }
  
  // Highlight high pairwise correlations
  const highCorrs = correlationMatrix.filter((c) => c.symbol1 !== c.symbol2 && c.correlation > 0.7);
  if (highCorrs.length > 0) {
    const pairs = highCorrs.slice(0, 2).map((c) => `${c.symbol1} & ${c.symbol2}`).join(", ");
    suggestions.push(`Strong pairwise correlations detected between: ${pairs}. High asset overlap increases tail risk. Consider reducing size in one of these holdings.`);
  }
  
  if (sharpeRatio < 0.5 && excessReturn > 0) {
    suggestions.push(`Sharpe ratio is weak (${sharpeRatio.toFixed(2)}). The portfolio is not generating sufficient excess return relative to its risk. Investigate optimizing asset weight allocations.`);
  }
  
  if (suggestions.length === 0) {
    suggestions.push("Portfolio risk and diversification look well-balanced. Maintain current allocations and monitor correlation levels periodically.");
  }

  return {
    expectedReturn: +portfolioExpectedReturn.toFixed(4),
    volatility: +portfolioVolatility.toFixed(4),
    sharpeRatio: +sharpeRatio.toFixed(2),
    sortinoRatio: +sortinoRatio.toFixed(2),
    treynorRatio: +treynorRatio.toFixed(4),
    beta: +portfolioBeta.toFixed(2),
    alpha: +portfolioAlpha.toFixed(4),
    maxDrawdown: +(maxDD * 100).toFixed(1),
    diversificationScore: +diversificationScore.toFixed(3),
    riskScore,
    sectorAllocation,
    correlationMatrix,
    suggestions
  };
}

function createEmptyAnalytics(): PortfolioAnalytics {
  return {
    expectedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    treynorRatio: 0,
    beta: 0,
    alpha: 0,
    maxDrawdown: 0,
    diversificationScore: 0,
    riskScore: 1,
    sectorAllocation: [],
    correlationMatrix: [],
    suggestions: ["No active holdings found. Build a portfolio to start receiving quantitative risk suggestions."]
  };
}
