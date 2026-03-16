"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function UploadPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Awaiting chart screenshot");

  const handleSelect = async (file: File) => {
    setStatus(`Selected ${file.name}. Preparing analysis payload...`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/signals/demo");
  };

  return (
    <div className="grid-shell py-8">
      <SectionHeader
        eyebrow="Chart Intake"
        title="Upload a screenshot for scalp analysis"
        description="The pipeline validates the image, detects chart boundaries, infers market context, and routes the screenshot to the AI engine."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <UploadDropzone onSelect={handleSelect} />
        <div className="glass rounded-[2rem] p-6">
          <div className="text-sm text-slate-400">Pipeline checklist</div>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 p-4">Image validation and rate limit protection</div>
            <div className="rounded-2xl border border-white/10 p-4">Auto-crop + screenshot cleanup</div>
            <div className="rounded-2xl border border-white/10 p-4">Indicator, pattern, and support-resistance detection</div>
            <div className="rounded-2xl border border-white/10 p-4">Signal generation with confidence scoring</div>
          </div>
          <div className="mt-6 rounded-2xl bg-accent/10 p-4 text-sm text-accent">{status}</div>
        </div>
      </div>
    </div>
  );
}
