import { GlobalErrorHandler } from "../system/errorHandler";

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

export class JournalService {
  private static getHeaders(token: string) {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  static async getEntries(token: string): Promise<JournalEntry[]> {
    return GlobalErrorHandler.wrapAsync(async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/pro/journal`, {
        headers: this.getHeaders(token)
      });
      if (!response.ok) throw new Error("Failed to fetch journal entries");
      return response.json();
    }, { feature: "Journal", action: "fetch" }, []);
  }

  static async addEntry(token: string, entry: Partial<JournalEntry>): Promise<JournalEntry> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const response = await fetch(`${apiBaseUrl}/pro/journal`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error("Failed to add journal entry");
    return response.json();
  }

  static async deleteEntry(token: string, id: string): Promise<void> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    await fetch(`${apiBaseUrl}/pro/journal/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(token)
    });
  }
}
