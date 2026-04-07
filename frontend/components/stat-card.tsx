"use client";

import { motion } from "framer-motion";

type Props = {
  label: string;
  value: string;
  hint: string;
};

export function StatCard({ label, value, hint }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, shadow: "var(--tw-shadow-glow)" }}
      className="glass-card p-6"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</div>
      {hint && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <div className="h-1 w-1 rounded-full bg-accent animate-pulse" />
          {hint}
        </div>
      )}
    </motion.div>
  );
}
