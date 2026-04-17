import { AnalysisResult } from "@/lib/api";
import { detectMarketContext, MarketContext } from "./marketContext";
import { applyHardGates, FilterResult } from "./tradeFilter";
import { optimizeEntry, EntryPlan } from "./entryTiming";
import { getExitPlan, ExitPlan } from "./exitManager";

export interface FinalTradePlan {
  id: string;
  status: "VALIDATED" | "REJECTED";
  confidence: number;
  context: MarketContext;
  filter: FilterResult;
  entry?: EntryPlan;
  exit?: ExitPlan;
  reason?: string;
}

export function processTrade(rawSignal: AnalysisResult): FinalTradePlan {
  const signalId = rawSignal.symbol || "UNKNOWN";
  
  // 1. Initial Confidence Check
  const confidence = rawSignal.confidence || 0;
  if (confidence < 75) {
     return {
        id: signalId,
        status: "REJECTED",
        confidence,
        context: detectMarketContext(rawSignal),
        filter: { valid: false, reason: "Insufficient AI confidence (< 75%)." },
        reason: "Confidence threshold not met."
     };
  }

  // 2. Context Detection
  const context = detectMarketContext(rawSignal);
  if (!context.validMarket) {
     return {
        id: signalId,
        status: "REJECTED",
        confidence,
        context,
        filter: { valid: false, reason: "Market environment not suitable (Low liquidity or abnormal volatility)." },
        reason: "Market context rejection."
     };
  }

  // 3. Trade Filter (Hard Gates)
  const filter = applyHardGates(rawSignal);
  if (!filter.valid) {
     return {
        id: signalId,
        status: "REJECTED",
        confidence,
        context,
        filter,
        reason: filter.reason || "Hard gate violation."
     };
  }

  // 4. Entry Optimization
  const entry = optimizeEntry(rawSignal);

  // 5. Exit Management
  const exit = getExitPlan(rawSignal, entry.entryPrice);

  return {
    id: signalId,
    status: "VALIDATED",
    confidence,
    context,
    filter,
    entry,
    exit
  };
}
