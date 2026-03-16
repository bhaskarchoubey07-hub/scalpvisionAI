import { SectionHeader } from "@/components/section-header";
import { LiveWatchlist } from "@/components/live-watchlist";

export default function WatchlistPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader eyebrow="Watchlist" title="Track high-probability symbols" description="Curate the names your scanner prioritizes across crypto pairs and stock tickers." />
      <LiveWatchlist />
    </div>
  );
}
