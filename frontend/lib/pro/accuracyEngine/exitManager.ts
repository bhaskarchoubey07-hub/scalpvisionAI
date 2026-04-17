export interface ExitPlan {
  stopLoss: number;
  takeProfit: number;
  managementSteps: string[];
}

import { AnalysisResult } from "@/lib/api";

export function getExitPlan(data: AnalysisResult, entry: number): ExitPlan {
  const sl = data.stop_loss || 0;
  const tp = data.take_profit || 0;
  
  const risk = Math.abs(entry - sl);
  
  const managementSteps = [
    `Initial SL placed at structural support/resistance: ${sl}`,
    `Move SL to BREAKEVEN once price reaches 1R (${(entry + risk).toFixed(2)})`,
    `Trail SL behind each swing low/high once price reaches 1.5R`,
    `Take partial profit (50%) at 1.5R to secure gains.`
  ];

  return { stopLoss: sl, takeProfit: tp, managementSteps };
}
