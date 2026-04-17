import { healthMonitor } from "./healthMonitor";

export class ErrorHandler {
  static async executeSafely<T>(
    fn: () => Promise<T>, 
    fallback: T, 
    context: string
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      healthMonitor.recordRequest(Date.now() - startTime, true);
      return result;
    } catch (error) {
      console.error(`[Reliability Error] ${context}:`, error);
      healthMonitor.recordRequest(Date.now() - startTime, false);
      return fallback;
    }
  }

  static wrapUI<T>(fn: () => T, fallback: T): T {
    try {
      return fn();
    } catch (error) {
      console.error("[UI Safety Error]:", error);
      return fallback;
    }
  }
}
