"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, Calendar, Tag, Search, Loader2, Trash2, IndianRupee } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ExpenseService, Expense } from "@/pro/services/expenseService";

export default function ExpensesPage() {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", category: "Trading" });

  const loadExpenses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await ExpenseService.getExpenses(token);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newExpense.title || !newExpense.amount) return;
    
    try {
      await ExpenseService.addExpense(token, {
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: new Date().toISOString()
      });
      setNewExpense({ title: "", amount: "", category: "Trading" });
      setIsAdding(false);
      loadExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await ExpenseService.deleteExpense(token, id);
      loadExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Expense Tracker</h1>
          <p className="text-slate-400 mt-2">Manage your trading overheads and personal fintech expenses.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-slate-950 font-bold shadow-glow hover:shadow-glow-lg transition-all active:scale-95">
          <Plus className="h-4 w-4" /> {isAdding ? "CANCEL" : "ADD EXPENSE"}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-3xl p-8 border border-white/10 bg-panel/40"
          >
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expense Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. TradingView Pro"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount (INR)</label>
                <input 
                  type="number" 
                  required
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                <select 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
                >
                  <option value="Trading">Trading</option>
                  <option value="Software">Software</option>
                  <option value="Education">Education</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all">
                  SAVE TRANSACTION
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
           <div className="glass rounded-2xl p-6 border border-white/5 bg-panel/40">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Burn</div>
              <div className="text-3xl font-black text-white flex items-center gap-1">
                <IndianRupee className="h-6 w-6 text-emerald-400" />
                {totalAmount.toLocaleString()}
              </div>
              <div className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest">Monthly limit: ₹50,000</div>
              <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (totalAmount / 50000) * 100)}%` }} />
              </div>
           </div>

           <div className="glass rounded-2xl p-6 border border-white/5 bg-panel/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                 <input 
                    type="text" 
                    placeholder="Search expenses..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none" 
                 />
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
           {loading ? (
             <div className="flex flex-col items-center justify-center p-20 gap-4 glass rounded-3xl border border-white/5 bg-panel/20">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                <p className="text-sm text-slate-500 uppercase tracking-widest">Syncing Records...</p>
             </div>
           ) : filteredExpenses.length === 0 ? (
             <div className="p-20 text-center text-slate-500 glass rounded-3xl border border-white/5 bg-panel/20">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
                No expenses found.
             </div>
           ) : (
             <div className="space-y-4">
               {filteredExpenses.map((expense, i) => (
                 <motion.div 
                   key={expense.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="glass rounded-3xl p-6 border border-white/5 bg-panel/20 flex items-center justify-between hover:bg-white/[0.02] transition-all group"
                 >
                   <div className="flex items-center gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Tag className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white uppercase">{expense.title}</div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                     <div className="text-lg font-black text-white">₹{Number(expense.amount).toLocaleString()}</div>
                     <button 
                       onClick={() => handleDelete(expense.id)}
                       className="p-2 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
