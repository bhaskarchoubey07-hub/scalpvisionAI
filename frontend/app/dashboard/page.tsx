import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { LiveMarketOverview } from "@/components/live-market-overview";
import { latestSignal, watchlist } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="Mission Control"
        title="Trading intelligence dashboard"
        description="Monitor live scanner output, recent AI predictions, and your strategy health from a single control surface."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Win Rate" value="74.2%" hint="30-day signal performance" />
        <StatCard label="Signals Today" value="28" hint="Stock + crypto scanner" />
        <StatCard label="Avg Confidence" value="84%" hint="Latest model batch" />
        <StatCard label="Active Watchlist" value="14" hint="Custom high-priority symbols" />
      </div>

      <div className="mt-8">
        <LiveMarketOverview />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Latest Signal</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold">{latestSignal.asset}</h2>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">{latestSignal.direction}</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Entry" value={latestSignal.entry} hint="Suggested execution" />
            <StatCard label="Stop" value={latestSignal.stopLoss} hint="Risk cap" />
            <StatCard label="Target" value={latestSignal.takeProfit} hint="Primary take profit" />
            <StatCard label="Confidence" value={`${latestSignal.confidence}%`} hint={`RR ${latestSignal.riskReward}`} />
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Watchlist Pulse</div>
          <div className="mt-5 space-y-4">
            {watchlist.map((item) => (
              <div key={item.symbol} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.symbol}</div>
                    <div className="text-xs text-slate-500">{item.market}</div>
                  </div>
                  <div className="text-sm text-accent">{item.change}</div>
                </div>
                <div className="mt-2 text-sm text-slate-400">{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
