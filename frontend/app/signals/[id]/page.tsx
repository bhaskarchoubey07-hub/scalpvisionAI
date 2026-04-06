import { SectionHeader } from "@/components/section-header";
import { latestSignal } from "@/lib/mock-data";

export default function SignalResultsPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="Signal Output"
        title="AI-generated scalp setup"
        description="This view combines raw chart interpretation with execution-ready levels and confidence reasoning."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-[2rem] p-6">
          <div className="aspect-[16/10] rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(61,217,184,0.12),rgba(16,28,49,0.9))] p-6">
            <div className="text-sm text-slate-400">Chart preview and AI overlays</div>
            <div className="mt-6 grid grid-cols-4 gap-3 text-xs text-slate-300">
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-3">Pattern: Bull Flag</div>
              <div className="rounded-xl border border-white/10 p-3">RSI: 54.2</div>
              <div className="rounded-xl border border-white/10 p-3">MACD: Bullish</div>
              <div className="rounded-xl border border-white/10 p-3">Timeframe: 5m</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{latestSignal.asset}</h2>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">{latestSignal.confidence}% confidence</span>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 p-4">Entry Price: {latestSignal.entry}</div>
            <div className="rounded-2xl border border-white/10 p-4">Stop Loss: {latestSignal.stopLoss}</div>
            <div className="rounded-2xl border border-white/10 p-4">Take Profit: {latestSignal.takeProfit}</div>
            <div className="rounded-2xl border border-white/10 p-4">Risk/Reward: {latestSignal.riskReward}</div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 p-4">
            <div className="text-sm font-semibold text-white">Entry & Exit Plan</div>
            <p className="mt-2 text-sm text-slate-300">{latestSignal.entryReason}</p>
            <div className="mt-3 space-y-2">
              {latestSignal.exitPlan?.map((p) => (
                <div key={p.label} className="rounded-xl bg-white/5 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-accent">{p.price}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{p.reason}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <div className="text-sm text-slate-400">Model reasoning</div>
            <div className="mt-3 space-y-3">
              {latestSignal.notes.map((note) => (
                <div key={note} className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
