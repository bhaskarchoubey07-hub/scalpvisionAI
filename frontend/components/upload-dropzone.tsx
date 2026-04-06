"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

type Props = {
  onSelect: (file: File) => void;
  disabled?: boolean;
};

export function UploadDropzone({ onSelect, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (disabled) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onSelect(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const file = event.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onPaste={(event) => {
        const item = event.clipboardData.files[0];
        if (item) handleFile(item);
      }}
      onClick={() => { if (!disabled) inputRef.current?.click(); }}
      className={`glass flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed p-8 text-center transition ${
        disabled ? "cursor-not-allowed opacity-60" :
        isOver ? "border-accent bg-accent/10" : "border-white/15 hover:border-accent/40"
      }`}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Chart preview"
          className="max-h-56 w-full rounded-2xl object-contain"
        />
      ) : (
        <>
          {disabled ? (
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
          ) : (
            <ImagePlus className="h-10 w-10 text-accent" />
          )}
          <h3 className="mt-5 text-xl font-medium">
            {disabled ? "Analyzing your chart…" : "Drop your chart screenshot here"}
          </h3>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Supports drag-and-drop, click upload, and clipboard paste. Auto-crop and chart-type detection are prepared in the analysis pipeline.
          </p>
        </>
      )}
    </div>
  );
}
