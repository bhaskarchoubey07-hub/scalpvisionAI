import { SectionHeader } from "@/components/section-header";

export default function StrategyLabPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader eyebrow="Strategy Lab" title="Experiment with rule sets" description="Compare how different entry filters, stop models, and timeframe combinations affect scalp performance." />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Preset strategy</div>
          <h2 className="mt-3 text-2xl font-semibold">Momentum Breakout Filter</h2>
          <p className="mt-3 text-sm text-slate-400">Requires trend alignment, RSI midline reclaim, and volume confirmation.</p>
        </div>
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Backtest snapshot</div>
          <h2 className="mt-3 text-2xl font-semibold">68% win rate</h2>
          <p className="mt-3 text-sm text-slate-400">Using 5m entries with 15m trend confirmation and 1:1.8 minimum reward-to-risk.</p>
        </div>
      </div>
    </div>
  );
}
