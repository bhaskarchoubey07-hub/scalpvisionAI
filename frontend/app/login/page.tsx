"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      router.push("/watchlist");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid-shell py-8">
      <SectionHeader eyebrow="Account" title="Log in to ScalpVision AI" description="Access your signals, saved watchlist, and personalized market tracking." />
      <form onSubmit={handleSubmit} className="glass mx-auto max-w-xl rounded-[2rem] p-8">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input name="email" type="email" required className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input name="password" type="password" required className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
          </label>
        </div>
        {error ? <div className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
        <button disabled={loading} className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-medium text-slate-950">
          {loading ? "Logging in..." : "Log in"}
        </button>
        <p className="mt-4 text-sm text-slate-400">
          Need an account?{" "}
          <Link href="/signup" className="text-accent">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
