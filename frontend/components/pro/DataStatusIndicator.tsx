"use client";

import React, { useEffect, useState } from "react";
import { healthMonitor, SystemHealth } from "@/lib/pro/system/healthMonitor";
import { Activity, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

export default function DataStatusIndicator() {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    const update = () => setHealth(healthMonitor.getHealth());
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  const getStatusColor = () => {
    if (health.status === "Healthy") return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    if (health.status === "Degraded") return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
  };

  const getStatusText = () => {
    if (health.status === "Healthy") return "Live Data Active";
    if (health.status === "Degraded") return "Latency High";
    return "Data Connectivity Error";
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${health.status === 'Healthy' ? 'text-white' : 'text-slate-400'}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="h-4 w-[1px] bg-white/10" />
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-slate-500" />
          <span className="text-[10px] font-medium text-slate-400">{health.latency}ms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-slate-500" />
          <span className="text-[10px] font-medium text-slate-400">{health.apiHealth}% Health</span>
        </div>
      </div>
    </div>
  );
}
