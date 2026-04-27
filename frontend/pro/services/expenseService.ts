import { GlobalErrorHandler } from "../system/errorHandler";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
};

export class ExpenseService {
  private static getHeaders(token: string) {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  static async getExpenses(token: string): Promise<Expense[]> {
    return GlobalErrorHandler.wrapAsync(async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/pro/expenses`, {
        headers: this.getHeaders(token)
      });
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    }, { feature: "Expenses", action: "fetch" }, []);
  }

  static async addExpense(token: string, expense: Partial<Expense>): Promise<Expense> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const response = await fetch(`${apiBaseUrl}/pro/expenses`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(expense)
    });
    if (!response.ok) throw new Error("Failed to add expense");
    return response.json();
  }

  static async deleteExpense(token: string, id: string): Promise<void> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    await fetch(`${apiBaseUrl}/pro/expenses/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(token)
    });
  }
}
