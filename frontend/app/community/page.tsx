import { SectionHeader } from "@/components/section-header";

export default function CommunityPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader eyebrow="Community" title="Trader discussion hub" description="Share chart ideas, compare AI readings, and discuss execution around live scalp setups." />
      <div className="grid gap-6 lg:grid-cols-3">
        {["BTC breakout retest", "SPY open scalp tactics", "Best confirmations for MACD reversals"].map((topic) => (
          <div key={topic} className="glass rounded-[2rem] p-6">
            <h2 className="text-xl font-semibold">{topic}</h2>
            <p className="mt-3 text-sm text-slate-400">Active thread with AI-annotated chart screenshots and community voting.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
