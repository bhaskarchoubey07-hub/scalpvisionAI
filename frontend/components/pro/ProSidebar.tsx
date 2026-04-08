"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Zap, 
  BarChart3, 
  Layers, 
  History, 
  BookOpen, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "../../lib/utils";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/pro" },
  { name: "AI Signals", icon: Zap, href: "/pro/signals" },
  { name: "Confidence Engine", icon: BarChart3, href: "/pro/confidence" },
  { name: "Multi-Timeframe", icon: Layers, href: "/pro/multitimeframe" },
  { name: "Backtesting", icon: History, href: "/pro/backtest" },
  { name: "Trade Journal", icon: BookOpen, href: "/pro/journal" },
];

export function ProSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-[#030712] flex flex-col z-[60]">
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white uppercase">Pro Lab</h1>
            <p className="text-[10px] text-accent font-medium uppercase tracking-widest">ScalpVision AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-white/5 border border-white/10" 
                  : "hover:bg-white/[0.03] border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-accent" : "text-slate-500 group-hover:text-slate-300"
                )} />
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                )}>
                  {item.name}
                </span>
              </div>
              {isActive && <div className="h-1 w-1 rounded-full bg-accent shadow-[0_0_8px_rgba(6,182,212,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Pro Badge / User Info */}
      <div className="p-4 mt-auto">
        <div className="glass rounded-2xl p-4 border border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
          <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-2">Power User</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Access: Enterprise</span>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
        
        <Link 
          href="/" 
          className="mt-4 flex items-center justify-center gap-2 p-3 text-xs text-slate-500 hover:text-white transition-colors"
        >
          Exit Pro Lab
        </Link>
      </div>
    </aside>
  );
}
