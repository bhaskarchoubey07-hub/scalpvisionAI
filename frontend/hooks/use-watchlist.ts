"use client";

import { useEffect, useState } from "react";
import { addWatchlistItem, fetchWatchlist, removeWatchlistItem, type WatchlistItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function useWatchlist() {
  const { token, user, isReady } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const next = await fetchWatchlist(token);
      setItems(next);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load watchlist");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady) return;
    void load();
  }, [token, isReady]);

  async function add(symbol: string, market: "stock" | "crypto" | "indian-stock" | "forex") {
    if (!token) {
      throw new Error("Please log in to add symbols to your watchlist");
    }

    await addWatchlistItem(token, symbol, market);
    await load();
  }

  async function remove(id: string) {
    if (!token) {
      throw new Error("Please log in to manage your watchlist");
    }

    await removeWatchlistItem(token, id);
    await load();
  }

  return {
    items,
    isLoading,
    error,
    add,
    remove,
    isAuthenticated: Boolean(user && token)
  };
}
