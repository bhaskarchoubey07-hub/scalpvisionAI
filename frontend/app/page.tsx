"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    title: "Visual chart intelligence",
    description: "Upload a screenshot and let the AI extract patterns, support, resistance, and momentum context.",
    icon: BrainCircuit
  },
  {
    title: "Fast scalp signals",
    description: "Receive entry, stop loss, take profit, and confidence scoring optimized for quick execution.",
    icon: Zap
  },
  {
    title: "Risk-first workflows",
    description: "Every signal includes reward-to-risk framing, validation steps, and image security checks.",
    icon: ShieldCheck
  }
];

export default function HomePage() {
  return (
    <div className="grid-shell py-8 sm:py-12">
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[2rem] p-8 sm:p-12">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-accent">AI Scalping Platform</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
            Decode chart screenshots into <span className="text-accent">actionable scalp signals</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
            ScalpVision AI combines screenshot analysis, pattern recognition, and signal generation for stock and crypto traders who move fast.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/upload" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-slate-950">
              Upload Chart
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm text-white">
              Explore Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signup" className="rounded-full border border-white/10 px-6 py-3 text-sm text-white">
              Create Account
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {features.map(({ title, description, icon: Icon }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="glass rounded-[2rem] p-6"
          >
            <Icon className="h-8 w-8 text-accent" />
            <h2 className="mt-5 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm text-slate-400">{description}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
