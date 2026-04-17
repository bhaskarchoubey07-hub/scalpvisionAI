export class PerformanceGuard {
  static withTimeout<T>(promise: Promise<T>, ms: number, timeoutValue: T): Promise<T> {
    const timeout = new Promise<T>((resolve) =>
      setTimeout(() => resolve(timeoutValue), ms)
    );
    return Promise.race([promise, timeout]);
  }

  static async lazyExecution(delayMs: number) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
