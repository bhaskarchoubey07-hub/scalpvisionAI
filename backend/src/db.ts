import { Pool } from "pg";
import { config } from "./config.js";

export const pool = new Pool({
  connectionString: config.databaseUrl
});

export async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        category TEXT DEFAULT 'General',
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized: expenses table ready.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_journal (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        asset_symbol TEXT NOT NULL,
        market TEXT NOT NULL,
        direction TEXT NOT NULL,
        pnl NUMERIC DEFAULT 0,
        outcome TEXT DEFAULT 'breakeven',
        notes TEXT,
        tags TEXT[] DEFAULT '{}',
        trade_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized: trade_journal table ready.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

// Auto-initialize when this file is imported
initDb();
