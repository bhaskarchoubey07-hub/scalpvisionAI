export interface SystemHealth {
  status: "Healthy" | "Degraded" | "Critical";
  latency: number;
  apiHealth: number; // 0-100
  lastUpdate: string;
}

class HealthMonitor {
  private latencies: number[] = [];
  private errors: number = 0;
  private totalRequests: number = 0;

  recordRequest(latency: number, success: boolean) {
    this.totalRequests++;
    this.latencies.push(latency);
    if (!success) this.errors++;
    
    // Keep only last 50 samples
    if (this.latencies.length > 50) this.latencies.shift();
  }

  getHealth(): SystemHealth {
    const avgLatency = this.latencies.length > 0 
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length 
      : 0;
    
    const errorRate = this.totalRequests > 0 ? (this.errors / this.totalRequests) * 100 : 0;
    const apiHealth = Math.max(0, 100 - errorRate);

    let status: SystemHealth["status"] = "Healthy";
    if (apiHealth < 90 || avgLatency > 2000) status = "Degraded";
    if (apiHealth < 70 || avgLatency > 5000) status = "Critical";

    return {
      status,
      latency: Math.round(avgLatency),
      apiHealth: Math.round(apiHealth),
      lastUpdate: new Date().toISOString()
    };
  }
}

export const healthMonitor = new HealthMonitor();
