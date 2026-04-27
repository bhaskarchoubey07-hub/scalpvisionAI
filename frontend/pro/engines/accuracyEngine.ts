import { SignalData } from "./signalEngine";

export class AccuracyEngine {
  static calculateWinProbability(signals: SignalData[]): number {
    if (signals.length === 0) return 0;
    const highConfidence = signals.filter(s => s.confidence > 85).length;
    return (highConfidence / signals.length) * 100;
  }

  static estimateRiskReward(signal: SignalData): number {
    const risk = Math.abs(signal.entry_price - signal.stop_loss);
    const reward = Math.abs(signal.take_profit - signal.entry_price);
    return risk === 0 ? 0 : reward / risk;
  }
}
