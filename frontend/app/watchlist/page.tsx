import { SectionHeader } from "@/components/section-header";
import { LiveWatchlist } from "@/components/live-watchlist";
import { IndianStockSearch } from "@/components/indian-stock-search";
import { PopularIndianStocks } from "@/components/popular-indian-stocks";

export default function WatchlistPage() {
  return (
    <div className="grid-shell py-8 space-y-12">
      <SectionHeader 
        eyebrow="Watchlist" 
        title="Track high-probability symbols" 
        description="Curate the names your scanner prioritizes across crypto pairs and stock tickers." 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
        <div className="space-y-12">
          {/* Search & Popular Quick Picks */}
          <div className="space-y-8 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 lg:p-10">
             <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Add Indian Companies</h3>
                <IndianStockSearch />
             </div>
             <PopularIndianStocks />
          </div>

          <LiveWatchlist />
        </div>

        {/* Sidebar info or stats can go here if needed */}
      </div>
    </div>
  );
}
