"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/section-header";
import { UploadDropzone } from "@/components/upload-dropzone";
import { uploadChart, analyzeChart, type AnalysisResult } from "@/lib/api";
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck, Zap } from "lucide-react";
import clsx from "clsx";

type Step = {
  label: string;
  status: "pending" | "loading" | "done" | "error";
};

const INITIAL_STEPS: Step[] = [
  { label: "Security validation & rate protection", status: "pending" },
  { label: "Optimized cloud storage upload", status: "pending" },
  { label: "Computer Vision pattern detection", status: "pending" },
  { label: "AI neural engine signal generation", status: "pending" },
];

export default function UploadPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const setStep = (index: number, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  };

  const handleSelect = async (file: File) => {
    if (isRunning) return;
    setIsRunning(true);
    setError(null);
    setSteps(INITIAL_STEPS);

    try {
      setStep(0, "loading");
      if (!file.type.startsWith("image/")) throw new Error("Only image files are supported.");
      if (file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8 MB.");
      await new Promise((r) => setTimeout(r, 600));
      setStep(0, "done");

      setStep(1, "loading");
      const { imageUrl } = await uploadChart(file);
      setStep(1, "done");

      setStep(2, "loading");
      await new Promise((r) => setTimeout(r, 800));
      setStep(2, "done");

      setStep(3, "loading");
      const result: AnalysisResult = await analyzeChart(imageUrl, "stock");
      setStep(3, "done");

      sessionStorage.setItem("latestSignal", JSON.stringify({ ...result, imageUrl }));
      await new Promise((r) => setTimeout(r, 400));
      router.push("/signals/result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      setSteps((prev) => prev.map((s) => (s.status === "loading" ? { ...s, status: "error" } : s)));
    } finally {
      setIsRunning(false);
    }
  };

  const allDone = steps.every((s) => s.status === "done");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid-shell py-8"
    >
      <SectionHeader
        eyebrow="Intelligence Intake"
        title="Upload market screenshot"
        description="Our neural pipeline processes your chart to extract trends, levels, and high-probability trade setups."
      />

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] mt-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <UploadDropzone onSelect={handleSelect} disabled={isRunning} />
          
          <div className="mt-8 flex items-center justify-center gap-6 text-slate-500">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secure Processing
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5 text-accent" /> Real-time Analysis
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-white">Pipeline Consensus</h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  layout
                  className={clsx(
                    "flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500",
                    step.status === "done" ? "border-accent/30 bg-accent/[0.03] text-accent" :
                    step.status === "loading" ? "border-white/20 bg-white/[0.05]" :
                    step.status === "error" ? "border-red-500/30 bg-red-500/[0.03] text-red-400" :
                    "border-white/[0.05] bg-white/[0.01]"
                  )}
                >
                  {step.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> :
                   step.status === "done" ? <CheckCircle2 className="h-4 w-4 text-accent" /> :
                   step.status === "error" ? <AlertCircle className="h-4 w-4 text-red-400" /> :
                   <div className="h-4 w-4 rounded-full border border-white/20" />}
                  <span className="text-xs font-medium tracking-tight">{step.label}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className={clsx(
            "mt-8 rounded-2xl p-5 text-center text-xs font-bold tracking-widest transition-all duration-500",
            error ? "bg-red-500/10 text-red-400 border border-red-500/20" :
            allDone ? "bg-accent/10 text-accent border border-accent/20" :
            isRunning ? "bg-white/5 text-slate-400 border border-white/10" :
            "bg-white/[0.02] text-slate-500 border border-white/[0.05]"
          )}>
            {error ? `SYSTEM ERROR : ${error.toUpperCase()}` :
             allDone ? "PIPELINE COMPLETE • REDIRECTING..." :
             isRunning ? "NEURAL ENGINE DEPLOYED..." :
             "AWAITING INPUT SOURCE"}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
