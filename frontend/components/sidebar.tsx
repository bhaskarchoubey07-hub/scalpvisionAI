"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BrainCircuit, CandlestickChart, LayoutDashboard, Shield, Trophy, Upload, User, Users } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Home", icon: CandlestickChart },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/watchlist", label: "Watchlist", icon: BarChart3 },
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
      <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-black/20 p-6 lg:block">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">ScalpVision AI</div>
          <p className="mt-3 text-sm text-slate-400">Scalping intelligence for stock and crypto chart screenshots.</p>
        </div>
        <nav className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                pathname === href ? "bg-accent/15 text-accent shadow-glow" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
