export type ErrorContext = {
  feature: string;
  action: string;
  [key: string]: any;
};

export class GlobalErrorHandler {
  static logError(error: unknown, context: ErrorContext) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PRO_ERROR] [${context.feature}] [${context.action}]:`, message, {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  static async wrapAsync<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    fallback?: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.logError(error, context);
      if (fallback !== undefined) return fallback;
      throw error;
    }
  }

  static getFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes("fetch")) return "Network connection failed. Please check your internet.";
      if (error.message.includes("401")) return "Session expired. Please log in again.";
      if (error.message.includes("403")) return "Access denied. Pro membership required.";
    }
    return "An unexpected error occurred in the system engine.";
  }
}
