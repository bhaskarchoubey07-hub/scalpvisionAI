export type JournalEntry = {
  id: string;
  asset_symbol: string;
  market: string;
  direction: string;
  pnl: number;
  outcome: string;
  notes: string;
  tags: string[];
  trade_date: string;
};

const STORAGE_KEY = "scalpvision_trades";

export const getTrades = (): JournalEntry[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse trades", e);
    return [];
  }
};

export const addTrade = (trade: Omit<JournalEntry, "id" | "trade_date">): JournalEntry => {
  const trades = getTrades();
  const newTrade: JournalEntry = {
    ...trade,
    id: crypto.randomUUID(),
    trade_date: new Date().toISOString(),
  };
  const updated = [newTrade, ...trades];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newTrade;
};

export const deleteTrade = (id: string): void => {
  const trades = getTrades();
  const updated = trades.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
