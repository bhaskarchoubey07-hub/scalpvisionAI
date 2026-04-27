type HealthMetric = {
  latency: number;
  status: "up" | "down" | "degraded";
  lastCheck: number;
};

class HealthMonitor {
  private metrics: Map<string, HealthMetric> = new Map();

  trackMetric(service: string, latency: number, success: boolean) {
    const current = this.metrics.get(service) || { latency: 0, status: "up", lastCheck: Date.now() };
    
    this.metrics.set(service, {
      latency: (current.latency * 0.7) + (latency * 0.3), // EMA
      status: success ? (latency > 1000 ? "degraded" : "up") : "down",
      lastCheck: Date.now()
    });
  }

  getServiceStatus(service: string): HealthMetric | undefined {
    return this.metrics.get(service);
  }

  getAllMetrics() {
    return Array.from(this.metrics.entries()).map(([name, metric]) => ({
      name,
      ...metric
    }));
  }
}

export const healthMonitor = new HealthMonitor();
