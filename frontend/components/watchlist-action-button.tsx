"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWatchlist } from "@/hooks/use-watchlist";

type Props = {
  symbol: string;
  market: "stock" | "crypto" | "indian-stock" | "forex";
};

export function WatchlistActionButton({ symbol, market }: Props) {
  const router = useRouter();
  const { add, items, isAuthenticated } = useWatchlist();
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const exists = items.some((item) => item.symbol === symbol && item.market === market);

  async function handleClick() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);
      setStatus(null);
      await add(symbol, market);
      setStatus("Saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleClick}
        disabled={saving || exists}
        className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {exists ? "In Watchlist" : saving ? "Saving..." : "Add to Watchlist"}
      </button>
      {status ? <div className="mt-2 text-xs text-slate-500">{status}</div> : null}
    </div>
  );
}
