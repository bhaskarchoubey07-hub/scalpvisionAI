import { SignalData } from "./signalEngine";

export class ExecutionGuard {
  static canExecute(signal: SignalData): { allowed: boolean; reason?: string } {
    // Prevent execution on extremely low confidence
    if (signal.confidence < 75) {
      return { allowed: false, reason: "Insufficient AI confidence for live execution." };
    }

    // Safety: check if entry price is within reasonable bounds of current market (placeholder logic)
    // In a real app, we'd check against a very fresh quote here.
    
    return { allowed: true };
  }

  static validateQuantity(qty: number): boolean {
    return qty > 0 && qty <= 1000; // Sample limits
  }
}
