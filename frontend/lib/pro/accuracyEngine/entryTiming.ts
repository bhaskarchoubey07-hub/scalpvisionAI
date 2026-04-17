import { AnalysisResult } from "@/lib/api";

export interface EntryPlan {
  entryPrice: number;
  entryZone: [number, number];
  instruction: string;
}

export function optimizeEntry(data: AnalysisResult): EntryPlan {
  const baseEntry = data.entry_price || data.current_price || 0;
  
  // Convert entry to zone (±0.2% around entry)
  const zoneSize = baseEntry * 0.002;
  const entryZone: [number, number] = [baseEntry - zoneSize, baseEntry + zoneSize];

  // Preference for retest
  const isRetest = data.signal?.toLowerCase().includes("retest");
  const instruction = isRetest 
    ? "Wait for retest of broken structure followed by M5/M15 candle confirmation." 
    : "Aggressive entry allowed, but wait for M5 impulsive candle close.";

  return { 
    entryPrice: baseEntry, 
    entryZone, 
    instruction 
  };
}
