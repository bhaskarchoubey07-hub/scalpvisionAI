"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

type Props = {
  onSelect: (file: File) => void;
};

export function UploadDropzone({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onSelect(file);
      }}
      onPaste={(event) => {
        const item = event.clipboardData.files[0];
        if (item) onSelect(item);
      }}
      onClick={() => inputRef.current?.click()}
      className={`glass flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed p-8 text-center transition ${
        isOver ? "border-accent bg-accent/10" : "border-white/15"
      }`}
      tabIndex={0}
      role="button"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
      <ImagePlus className="h-10 w-10 text-accent" />
      <h3 className="mt-5 text-xl font-medium">Drop your chart screenshot here</h3>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        Supports drag-and-drop, click upload, and clipboard paste. Auto-crop and chart-type detection are prepared in the analysis pipeline.
      </p>
    </div>
  );
}
