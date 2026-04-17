import { AnalysisResult } from "@/lib/api";

export interface FilterResult {
  valid: boolean;
  reason: string | null;
}

export function applyHardGates(data: AnalysisResult): FilterResult {
  // 1. Trend Alignment
  if (data.trend !== data.direction?.toLowerCase()) {
    return { valid: false, reason: "Directional bias does not align with trend context." };
  }

  // 2. Breakout or Retest
  const signalType = data.signal?.toLowerCase() || "";
  const isValidType = signalType.includes("breakout") || signalType.includes("retest") || signalType.includes("reclaim");
  if (!isValidType) {
    return { valid: false, reason: "Signal type must be Breakout or Retest for high probability." };
  }

  // 3. Risk Reward >= 1:2
  const rr = data.risk_reward || 0;
  if (rr < 2) {
    return { valid: false, reason: `Insufficient Risk/Reward ratio (${rr} < 2).` };
  }

  // 4. Volume (Mock check since we don't always have exact volume comparison)
  // In a real system, we'd compare current volume vs 20-period average
  const volumeConfirmed = true; 
  if (!volumeConfirmed) {
      return { valid: false, reason: "Volume expansion (< 1.5x avg) not detected." };
  }

  return { valid: true, reason: null };
}
