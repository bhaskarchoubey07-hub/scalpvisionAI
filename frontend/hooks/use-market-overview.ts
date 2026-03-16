"use client";

import { useEffect, useState } from "react";
import { fetchMarketOverview, type MarketOverview } from "@/lib/api";

type MarketOverviewState = {
  data: MarketOverview | null;
  error: string | null;
  lastUpdated: string | null;
  isLoading: boolean;
};

const REFRESH_INTERVAL_MS = 10000;

export function useMarketOverview(): MarketOverviewState {
  const [data, setData] = useState<MarketOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const next = await fetchMarketOverview();
        if (!active) return;
        setData(next);
        setError(null);
        setLastUpdated(new Date().toISOString());
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load live data");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    function refreshOnFocus() {
      if (document.visibilityState === "visible") {
        void load();
      }
    }

    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load();
      }
    }, REFRESH_INTERVAL_MS);

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  return { data, error, lastUpdated, isLoading };
}
