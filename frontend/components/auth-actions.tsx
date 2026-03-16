"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function AuthActions() {
  const { user, logout, isReady } = useAuth();

  if (!isReady) {
    return <div className="text-xs text-slate-500">Loading account...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
          Log in
        </Link>
        <Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate-950">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium text-white">{user.full_name}</div>
        <div className="text-xs text-slate-500">{user.email}</div>
      </div>
      <button onClick={logout} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
        Log out
      </button>
    </div>
  );
}
