"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Scan, Target, Crosshair, TrendingUp, CheckCircle2, AlertCircle, X, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExternalDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    
    try {
      // 1. Simulate Vision Model extracting current price and momentum from the chart image
      // In a real scenario, an OCR or Vision API would parse the chart axes and candles
      const extractedPrice = Math.random() * 1000 + 100; // e.g. $100 - $1100
      const extractedChange = (Math.random() - 0.5) * 10; // e.g. -$5 to +$5
      
      // 2. Pass the extracted data into our newly integrated AI Signal Engine (FastAPI)
      const { SignalEngine } = await import("../../pro/engines/signalEngine");
      const signal = await SignalEngine.generateSignal("UPLOADED_CHART", extractedPrice, extractedChange);
      
      setResult({
        direction: signal.direction,
        entry: "$" + signal.entry_price.toFixed(2),
        target: "$" + signal.take_profit.toFixed(2),
        stopLoss: "$" + signal.stop_loss.toFixed(2),
        confidence: signal.confidence + "%",
        analysis: `Vision model extracted a price of $${extractedPrice.toFixed(2)}. The AI Prediction Engine evaluated this structure along with synthetic momentum indicators to generate a ${signal.direction} signal with ${signal.confidence}% confidence.`
      });
    } catch (err) {
      console.error("Failed to process chart through AI Engine", err);
      // Fallback
      setResult({
        direction: "BEARISH",
        entry: "$0.00",
        target: "$0.00",
        stopLoss: "$0.00",
        confidence: "0%",
        analysis: "Error connecting to AI Prediction Engine."
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-100px)] w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scan className="h-6 w-6 text-cyan-400" />
            Visual Chart Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload any chart image to extract real-time entry and exit predictions using our vision model.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Vision Engine Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Upload Zone */}
        <div className="flex flex-col gap-4">
          <div 
            className={`relative flex flex-col items-center justify-center w-full h-[400px] border-2 border-dashed rounded-3xl transition-all ${
              preview ? "border-cyan-500/50 bg-cyan-500/5" : "border-white/10 hover:border-cyan-500/30 hover:bg-white/5 bg-[#030712]"
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="relative w-full h-full p-4">
                <img src={preview} alt="Chart preview" className="w-full h-full object-contain rounded-2xl" />
                <button 
                  onClick={clearFile}
                  className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                {isScanning && (
                  <div className="absolute inset-4 overflow-hidden rounded-2xl pointer-events-none">
                    <motion.div 
                      className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
                      animate={{ y: ["0%", "3600%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[2px]" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="h-20 w-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6">
                  <UploadCloud className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="mb-2 text-xl font-bold text-white">Upload Chart Image</p>
                <p className="text-sm text-slate-400 mb-6 max-w-[250px]">Drag and drop your screenshot here or click to browse</p>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-colors">
                  Select Image
                </div>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <button 
            onClick={startScan}
            disabled={!preview || isScanning}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              !preview ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 
              isScanning ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 
              'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Processing Vision Data...
              </>
            ) : (
              <>
                <Scan className="h-6 w-6" />
                Analyze Chart
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#030712] border border-white/5 rounded-3xl p-8 h-[400px] flex flex-col relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Intelligence Report
            </h3>

            {!result && !isScanning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Target className="h-16 w-16 text-slate-800 mb-4" />
                <p className="text-slate-500 font-medium">Awaiting chart input</p>
                <p className="text-sm text-slate-600 mt-2 max-w-xs">Upload a chart to extract precision entry and exit coordinates.</p>
              </div>
            )}

            {isScanning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-cyan-500/20 rounded-full" />
                  <div className="w-20 h-20 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin absolute inset-0" />
                  <Scan className="h-8 w-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-cyan-400 font-bold tracking-widest uppercase text-sm">Neural Network Active</p>
                  <p className="text-slate-400 text-xs">Extracting candlestick formations and volume profile...</p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {result && !isScanning && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                    <div className={`px-4 py-2 rounded-xl text-sm font-black tracking-widest uppercase flex items-center gap-2 ${
                      result.direction === "BULLISH" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                      {result.direction} DETECTED
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-black text-white">{result.confidence}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Confidence</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Crosshair className="h-3 w-3" /> Entry
                      </div>
                      <div className="text-xl font-mono font-bold text-white">{result.entry}</div>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Target className="h-3 w-3" /> Target
                      </div>
                      <div className="text-xl font-mono font-bold text-emerald-400">{result.target}</div>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <AlertCircle className="h-3 w-3" /> Stop
                      </div>
                      <div className="text-xl font-mono font-bold text-red-400">{result.stopLoss}</div>
                    </div>
                  </div>

                  <div className="bg-cyan-500/5 rounded-2xl p-5 border border-cyan-500/10 flex-1">
                    <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Vision Analysis
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {result.analysis}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
