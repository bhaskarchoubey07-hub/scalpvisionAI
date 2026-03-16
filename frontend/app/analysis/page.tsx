import { SectionHeader } from "@/components/section-header";

const modules = [
  "Candlestick pattern recognition",
  "Trendline extraction",
  "Support and resistance zoning",
  "RSI / MACD indicator reading",
  "Multi-timeframe consensus engine"
];

export default function AnalysisPage() {
  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="AI Engine"
        title="Analysis pipeline observability"
        description="Inspect how each model stage contributes to the final scalp setup, from preprocessing to projection."
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Pipeline stages</div>
          <div className="mt-4 space-y-3">
            {modules.map((module, index) => (
              <div key={module} className="rounded-2xl border border-white/10 p-4 text-sm">
                Stage {index + 1}: {module}
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Current model health</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-xs text-slate-500">Pattern detector</div>
              <div className="mt-3 text-3xl font-semibold">91.3%</div>
              <div className="mt-2 text-sm text-slate-400">Validation accuracy</div>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-xs text-slate-500">Projection model</div>
              <div className="mt-3 text-3xl font-semibold">84.7%</div>
              <div className="mt-2 text-sm text-slate-400">Directional precision</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
