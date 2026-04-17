"use client";

import React, { useEffect } from "react";
import TradingViewChart from "./TradingViewChart";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface FullscreenChartProps {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FullscreenChart({ symbol, isOpen, onClose }: FullscreenChartProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black w-screen h-screen flex flex-col overflow-hidden">
      <div className="absolute top-6 right-6 z-[10001]">
        <button 
          onClick={onClose}
          className="h-12 w-12 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all backdrop-blur-md"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 w-full h-full">
         <TradingViewChart symbol={symbol} />
      </div>
    </div>,
    document.body
  );
}
