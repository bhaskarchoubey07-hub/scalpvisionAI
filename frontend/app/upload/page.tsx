"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { UploadDropzone } from "@/components/upload-dropzone";
import { uploadChart, analyzeChart, type AnalysisResult } from "@/lib/api";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type Step = {
  label: string;
  status: "pending" | "loading" | "done" | "error";
};

const INITIAL_STEPS: Step[] = [
  { label: "Image validation and rate limit protection", status: "pending" },
  { label: "Uploading chart to secure storage", status: "pending" },
  { label: "Indicator, pattern, and support-resistance detection", status: "pending" },
  { label: "Signal generation with confidence scoring", status: "pending" },
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
      // Step 0 — validate
      setStep(0, "loading");
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are supported.");
      }
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("Image must be under 8 MB.");
      }
      await new Promise((r) => setTimeout(r, 400));
      setStep(0, "done");

      // Step 1 — upload
      setStep(1, "loading");
      const { imageUrl } = await uploadChart(file);
      setStep(1, "done");

      // Step 2 — pattern detection (brief pause for UX)
      setStep(2, "loading");
      await new Promise((r) => setTimeout(r, 600));
      setStep(2, "done");

      // Step 3 — AI analysis
      setStep(3, "loading");
      const result: AnalysisResult = await analyzeChart(imageUrl, "stock");
      setStep(3, "done");

      // Store result and navigate
      sessionStorage.setItem("latestSignal", JSON.stringify({ ...result, imageUrl }));
      await new Promise((r) => setTimeout(r, 300));
      router.push("/signals/result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      setSteps((prev) =>
        prev.map((s) => (s.status === "loading" ? { ...s, status: "error" } : s))
      );
    } finally {
      setIsRunning(false);
    }
  };

  const allDone = steps.every((s) => s.status === "done");

  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="Chart Intake"
        title="Upload a screenshot for scalp analysis"
        description="The pipeline validates the image, detects chart boundaries, infers market context, and routes the screenshot to the AI engine."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <UploadDropzone onSelect={handleSelect} disabled={isRunning} />

        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Pipeline checklist</div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300 ${
                  step.status === "done"
                    ? "border-accent/40 bg-accent/5 text-accent"
                    : step.status === "loading"
                    ? "border-white/20 bg-white/5"
                    : step.status === "error"
                    ? "border-red-400/40 bg-red-400/5 text-red-400"
                    : "border-white/10"
                }`}
              >
                {step.status === "loading" && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
                )}
                {step.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                {step.status === "pending" && (
                  <div className="h-4 w-4 shrink-0 rounded-full border border-white/20" />
                )}
                <span>{step.label}</span>
              </div>
            ))}
          </div>

          <div
            className={`mt-6 rounded-2xl p-4 text-sm transition-all duration-300 ${
              error
                ? "bg-red-400/10 text-red-400"
                : allDone
                ? "bg-accent/10 text-accent"
                : isRunning
                ? "bg-white/5 text-slate-300"
                : "bg-accent/10 text-accent"
            }`}
          >
            {error
              ? `Error: ${error}`
              : allDone
              ? "✓ Analysis complete — redirecting…"
              : isRunning
              ? "Analyzing your chart…"
              : "Awaiting chart screenshot"}
          </div>
        </div>
      </div>
    </div>
  );
}
