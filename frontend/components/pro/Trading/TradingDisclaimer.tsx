import React from "react";
import { AlertTriangle } from "lucide-react";

export default function TradingDisclaimer() {
  return (
    <div className="mt-8 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-[11px] text-slate-400 leading-relaxed italic">
        <span className="font-bold text-amber-500 uppercase not-italic">Disclaimer:</span> This platform provides analysis tools only. All trades are executed on third-party broker platforms. We do not execute trades, manage funds, or provide personalized financial advice. Please consult with a certified financial advisor before making any investment decisions.
      </p>
    </div>
  );
}
