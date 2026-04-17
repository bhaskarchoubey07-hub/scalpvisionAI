import { AnalysisResult } from "@/lib/api";
import { DataValidator } from "../data/dataValidator";
import { healthMonitor } from "./healthMonitor";

/**
 * Ensures data is valid and fresh before allowing signal generation.
 */
export function validateSignalContext(data: AnalysisResult): { canTrade: boolean; reason?: string } {
  // 1. Data Integrity Check
  if (!data.current_price || data.current_price <= 0) {
    return { canTrade: false, reason: "Invalid price data" };
  }

  // 2. High >= Low check
  if (data.supports && data.resistances) {
     const high = Math.max(...data.resistances);
     const low = Math.min(...data.supports);
     if (low > high) return { canTrade: false, reason: "Inconsistent market structure (L > H)" };
  }

  // 3. System Health Check
  const health = healthMonitor.getHealth();
  if (health.status === "Critical") {
    return { canTrade: false, reason: "System health critical - Trading suspended" };
  }

  return { canTrade: true };
}

/**
 * Realistic Backtest Engine with slippage and fees.
 */
export class BacktestEngine {
  private static readonly SLIPPAGE = 0.0005; // 0.05%
  private static readonly TRANSACTION_FEE = 0.001; // 0.1%

  static calculateRealisticPnL(entry: number, exit: number, direction: "Long" | "Short"): number {
     const rawPnL = direction === "Long" ? (exit - entry) : (entry - exit);
     
     // Subtract friction
     const frictionlessTotal = Math.abs(entry) + Math.abs(exit);
     const friction = frictionlessTotal * (this.SLIPPAGE + this.TRANSACTION_FEE);
     
     return rawPnL - friction;
  }
}
