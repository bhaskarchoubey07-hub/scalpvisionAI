"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { fetchForecast, type ForecastResult, fetchMarketOverview, type MarketQuote } from "@/lib/api";
import { Loader2, TrendingUp, Activity, Shield, Brain, BarChart3, Newspaper, Wallet } from "lucide-react";
import clsx from "clsx";

const COLORS = ["#1a3a5c", "#2d8f6f", "#e8913a", "#6366f1", "#ec4899", "#f59e0b"];

const EXPERIENCE_MODES = [
  { id: "prediction", label: "Stock Prediction", icon: TrendingUp },
  { id: "sentiment", label: "News Sentiment", icon: Newspaper },
  { id: "portfolio", label: "Portfolio Analyzer", icon: Wallet },
  { id: "advisor", label: "AI Advisor", icon: Brain },
];

export default function ForecastPage() {
  const [ticker, setTicker] = useState("INFY.NS");
  const [historyWindow, setHistoryWindow] = useState(2);
  const [forecastHorizon, setForecastHorizon] = useState(15);
  const [mode, setMode] = useState("prediction");
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [compareTickers, setCompareTickers] = useState(["INFY.NS", "TCS.NS", "RELIANCE.NS"]);
  const [multiForecasts, setMultiForecasts] = useState<Record<string, ForecastResult>>({});

  // KPI calculations
  const kpis = useMemo(() => {
    if (!forecastData || forecastData.points.length < 2) {
      return { annualReturn: 0, volatility: 0, sharpe: 0 };
    }
    const pts = forecastData.points;
    const first = pts[0].price;
    const last = pts[pts.length - 1].price;
    const years = Math.max(pts.length / 252, 1);
    const annualReturn = ((last / first) ** (1 / years) - 1) * 100;

    // Simple volatility from returns
    const returns: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      returns.push((pts[i].price - pts[i - 1].price) / pts[i - 1].price);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    const dailyVol = Math.sqrt(variance);
    const annualVol = dailyVol * Math.sqrt(252) * 100;
    const riskFreeRate = 6;
    const sharpe = annualVol > 0 ? (annualReturn - riskFreeRate) / annualVol : 0;

    return { annualReturn, volatility: annualVol, sharpe };
  }, [forecastData]);

  // Normalized multi-line chart data
  const performanceData = useMemo(() => {
    const tickers = Object.keys(multiForecasts);
    if (tickers.length === 0) return [];

    const maxLen = Math.max(...tickers.map(t => multiForecasts[t].points.length));
    const data: Record<string, number | string>[] = [];

    for (let i = 0; i < maxLen; i++) {
      const row: Record<string, number | string> = {};
      tickers.forEach(t => {
        const pts = multiForecasts[t].points;
        if (i < pts.length) {
          const basePrice = pts[0].price;
          row[t] = basePrice > 0 ? +(pts[i].price / basePrice).toFixed(4) : 1;
          row["date"] = pts[i].date;
        }
      });
      data.push(row);
    }
    return data;
  }, [multiForecasts]);

  // Pie chart data
  const pieData = useMemo(() => {
    return compareTickers.map(t => ({
      name: t.replace(".NS", "").replace(".BO", ""),
      value: +(100 / compareTickers.length).toFixed(1),
    }));
  }, [compareTickers]);

  const runForecast = async () => {
    setLoading(true);
    try {
      const results: Record<string, ForecastResult> = {};
      for (const t of compareTickers) {
        const data = await fetchForecast(t, "indian-stock");
        results[t] = data;
      }
      setMultiForecasts(results);
      setForecastData(results[ticker] || Object.values(results)[0]);
    } catch (err) {
      console.error("Forecast error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runForecast();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar Controls ── */}
      <aside className="w-[280px] shrink-0 border-r border-slate-200 bg-white p-6 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-slate-800">FinAI Control Deck</h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            A richer command center for prediction, sentiment, portfolio signals, and AI guidance.
          </p>
        </div>

        {/* Primary Ticker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Primary ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* History Window */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">History window</label>
          <input
            type="range" min={1} max={10} value={historyWindow}
            onChange={(e) => setHistoryWindow(+e.target.value)}
            className="w-full accent-teal-600"
          />
          <div className="text-center text-sm font-semibold text-teal-700">{historyWindow}</div>
        </div>

        {/* Forecast Horizon */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Forecast horizon</label>
          <input
            type="range" min={1} max={60} value={forecastHorizon}
            onChange={(e) => setForecastHorizon(+e.target.value)}
            className="w-full accent-teal-600"
          />
          <div className="text-center text-sm font-semibold text-teal-700">{forecastHorizon}</div>
        </div>

        {/* Experience Mode */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-600">Choose experience</label>
          {EXPERIENCE_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all text-left",
                mode === m.id
                  ? "bg-teal-50 text-teal-700 font-semibold ring-1 ring-teal-200"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className={clsx(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                mode === m.id ? "border-teal-600" : "border-slate-300"
              )}>
                {mode === m.id && <div className="h-2 w-2 rounded-full bg-teal-600" />}
              </div>
              {m.label}
            </button>
          ))}
        </div>

        {/* Run Button */}
        <button
          onClick={runForecast}
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Run Analysis"}
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 bg-slate-50 p-8 space-y-8 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-teal-600 px-5 py-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Annual Return</span>
            </div>
            <div className="px-5 py-4">
              <div className="text-3xl font-bold text-slate-800">{kpis.annualReturn.toFixed(2)}%</div>
              <div className="text-sm font-semibold text-teal-600 mt-1">Portfolio drift</div>
              <div className="text-xs text-slate-400 mt-0.5">Higher is better</div>
            </div>
          </div>
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-orange-500 px-5 py-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Volatility</span>
            </div>
            <div className="px-5 py-4">
              <div className="text-3xl font-bold text-slate-800">{kpis.volatility.toFixed(2)}%</div>
              <div className="text-sm font-semibold text-orange-500 mt-1">Risk profile</div>
              <div className="text-xs text-slate-400 mt-0.5">Annualized variation</div>
            </div>
          </div>
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="bg-red-500 px-5 py-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Sharpe Ratio</span>
            </div>
            <div className="px-5 py-4">
              <div className="text-3xl font-bold text-slate-800">{kpis.sharpe.toFixed(2)}</div>
              <div className="text-sm font-semibold text-red-500 mt-1">Risk-adjusted return</div>
              <div className="text-xs text-slate-400 mt-0.5">Using 6% risk-free rate</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          {/* Performance Wave */}
          <div className="rounded-xl bg-white shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Relative Performance Wave</h3>
            {loading ? (
              <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend iconType="line" wrapperStyle={{ fontSize: 12 }} />
                  {compareTickers.map((t, i) => (
                    <Line
                      key={t}
                      type="monotone"
                      dataKey={t}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      name={t.replace(".NS", "").replace(".BO", "")}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Portfolio Mix */}
          <div className="rounded-xl bg-white shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Equal-Weight Mix</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ value }) => `${value}%`}
                  labelLine={false}
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Narrative */}
        {forecastData?.narrative && (
          <div className="rounded-xl bg-white shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-700">AI Insight</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{forecastData.narrative}</p>
          </div>
        )}
      </main>
    </div>
  );
}
