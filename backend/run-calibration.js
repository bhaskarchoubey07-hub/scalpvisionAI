/**
 * run-calibration.js
 * 
 * Standalone script to "train" the AI model.
 * Fetches 5 years of historical data for key symbols and optimizes weights.
 */

import { calibrateMarket } from "./src/services/backtester.js";
import { pool } from "./src/db.js";

async function main() {
  console.log("🚀 Starting ScalpVision AI Calibration...");

  const markets = [
    {
      name: "indian-stock",
      symbols: [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", 
        "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LT.NS", "MARUTI.NS"
      ]
    },
    {
      name: "crypto",
      symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]
    }
  ];

  for (const mkt of markets) {
    try {
      const weights = await calibrateMarket(mkt.name, mkt.symbols);
      console.log(`✅ ${mkt.name.toUpperCase()} calibrated successfully.`);
      console.log("Optimal Weights:", JSON.stringify(weights.markets[mkt.name], null, 2));
    } catch (err) {
      console.error(`❌ Calibration failed for ${mkt.name}:`, err);
    }
  }

  console.log("\n✨ AI Training Phase Complete. Optimized weights saved to /data/calibration/");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal Calibration Error:", err);
  process.exit(1);
});
