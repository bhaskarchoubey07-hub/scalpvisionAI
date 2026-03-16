"use client";

import { useState } from "react";
import { useMarketOverview } from "@/hooks/use-market-overview";
import { WatchlistActionButton } from "@/components/watchlist-action-button";

type TabKey = "stock" | "crypto" | "indian-stock" | "forex";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value > 1000 ? 2 : 4
  }).format(value);
}

function formatChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function LiveMarketOverview() {
  const { data, error, isLoading, lastUpdated } = useMarketOverview();
  const [activeTab, setActiveTab] = useState<TabKey>("stock");

  if (error) {
    return <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div>;
  }

  if (isLoading || !data) {
    return <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">Loading live stock, crypto, Indian market, and forex data...</div>;
  }

  const tabs: Array<{
    key: TabKey;
    label: string;
    provider: string;
    quotes: typeof data.stocks;
    subtitle: string;
  }> = [
    {
      key: "stock",
      label: "US Stocks",
      provider: data.stockProvider,
      quotes: data.stocks,
      subtitle: "Track major U.S. equity movers"
    },
    {
      key: "crypto",
      label: "Crypto",
      provider: data.cryptoProvider,
      quotes: data.crypto,
      subtitle: "Current crypto spot market prices"
    },
    {
      key: "indian-stock",
      label: "Indian Stocks",
      provider: data.indianStockProvider,
      quotes: data.indianStocks,
      subtitle: "NSE market coverage in its own tab"
    },
    {
      key: "forex",
      label: "Forex",
      provider: data.forexProvider,
      quotes: data.forex,
      subtitle: "Major forex pairs in a separate tab"
    }
  ];

  const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  return (
    <section className="glass rounded-[2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Live Market Center</div>
          <div className="mt-1 text-xs text-slate-500">{currentTab.subtitle}</div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>Refreshes every 10s</div>
          <div>{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : "Waiting..."}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === tab.key ? "bg-accent text-slate-950" : "border border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{currentTab.label}</div>
            <div className="mt-1 text-xs text-slate-500">Source: {currentTab.provider}</div>
          </div>
          <div className="text-xs text-slate-500">{currentTab.key === "forex" ? "Spot pairs" : "Live quotes"}</div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {currentTab.quotes.map((quote) => (
            <div key={quote.symbol} className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{quote.symbol}</div>
                  <div className="text-xs text-slate-500">{quote.currency}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatPrice(quote.price)}</div>
                  <div className={quote.changePercent >= 0 ? "text-sm text-accent" : "text-sm text-red-300"}>{formatChange(quote.changePercent)}</div>
                </div>
              </div>
              <WatchlistActionButton symbol={quote.symbol} market={currentTab.key} />
            </div>
          ))}
          {!currentTab.quotes.length ? <div className="text-sm text-slate-400">No quotes available in this tab right now.</div> : null}
        </div>
      </div>
    </section>
  );
}
