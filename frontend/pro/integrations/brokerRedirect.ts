import { ExecutionGuard } from "../engines/executionGuard";
import { SignalData } from "../engines/signalEngine";

export class BrokerRedirect {
  private static BROKERS = {
    ZERODHA: "https://kite.zerodha.com/chart/ext/tvc/",
    UPSTOX: "https://pro.upstox.com/terminal/"
  };

  static redirectToBroker(signal: SignalData, broker: "ZERODHA" | "UPSTOX" = "ZERODHA") {
    const safety = ExecutionGuard.canExecute(signal);
    
    if (!safety.allowed) {
      alert(safety.reason || "Execution blocked by safety guard.");
      return;
    }

    const baseUrl = this.BROKERS[broker];
    const symbol = signal.asset_symbol.replace(".NS", "").replace(".BO", "");
    
    // In a real implementation, this would build a deep link with order parameters
    // For now, we redirect to the chart/terminal as per "no direct execution" rule
    const url = `${baseUrl}?symbol=${symbol}&side=${signal.direction === 'LONG' ? 'BUY' : 'SELL'}`;
    
    window.open(url, "_blank");
  }
}
