import { SignalData } from "./signalEngine";

export class ValidationEngine {
  private static MIN_CONFIDENCE = 70;

  static isValidSignal(signal: SignalData): boolean {
    // Filter weak signals
    if (signal.confidence < this.MIN_CONFIDENCE) {
      console.log(`[VALIDATION_ENGINE] Signal rejected: ${signal.asset_symbol} confidence ${signal.confidence}% < ${this.MIN_CONFIDENCE}%`);
      return false;
    }

    // Additional sanity checks
    if (signal.entry_price <= 0) return false;
    if (signal.take_profit === signal.entry_price) return false;

    return true;
  }
}
