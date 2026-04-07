"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BrainCircuit, CandlestickChart, LayoutDashboard, Shield, Trophy, Upload, User, Users, Wallet } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Home", icon: CandlestickChart },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/watchlist", label: "Watchlist", icon: BarChart3 },
  { href: "/india", label: "India Market", icon: CandlestickChart },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/analysis", label: "AI Analysis", icon: BrainCircuit },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
  { href: "/strategy-lab", label: "Strategy Lab", icon: CandlestickChart },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-white/10 bg-base/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="text-xs uppercase tracking-[0.3em] text-accent">ScalpVision AI</div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "whitespace-nowrap rounded-full px-4 py-2 text-xs",
                pathname === href ? "bg-accent/15 text-accent" : "bg-white/5 text-slate-300"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <aside className="sticky top-0 hidden h-screen bg-black/20 p-6 backdrop-blur-3xl lg:block">
        <div className="mb-10 px-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-pulse" />
            <div className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-white">ScalpVision AI</div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Premium scalp intelligence for global markets.</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-accent/10 text-accent shadow-glow" 
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                )}
              >
                <Icon className={clsx("h-4 w-4 transition-transform duration-200 group-hover:scale-110", isActive ? "text-accent" : "text-slate-500 group-hover:text-white")} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
