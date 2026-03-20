import { useState, useCallback } from "react";
import { Transaction, Account, DEFAULT_ACCOUNTS, SAMPLE_TRANSACTIONS, Category, CATEGORIES } from "./types";

export function useFinanceStore() {
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);

  const addTransaction = useCallback((
    amount: number,
    description: string,
    category: Category,
    type: "income" | "expense",
    accountId: string
  ) => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      amount,
      description,
      category,
      date: new Date(),
      type,
      accountId,
    };
    setTransactions(prev => [newTx, ...prev]);
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id !== accountId) return acc;
        const delta = type === "income" ? amount : -amount;
        return { ...acc, balance: acc.balance + delta };
      })
    );
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, "id">>) => {
    setTransactions(prev => {
      const old = prev.find(t => t.id === id);
      if (!old) return prev;
      const updated = { ...old, ...updates };
      // Adjust account balances if amount, type, or account changed
      const oldDelta = old.type === "income" ? old.amount : -old.amount;
      const newDelta = updated.type === "income" ? updated.amount : -updated.amount;
      if (oldDelta !== newDelta || old.accountId !== updated.accountId) {
        setAccounts(accs => accs.map(acc => {
          let balance = acc.balance;
          if (acc.id === old.accountId) balance -= oldDelta;
          if (acc.id === updated.accountId) balance += newDelta;
          return balance !== acc.balance ? { ...acc, balance } : acc;
        }));
      }
      return prev.map(t => t.id === id ? updated : t);
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id);
      if (tx) {
        const delta = tx.type === "income" ? tx.amount : -tx.amount;
        setAccounts(accs => accs.map(acc =>
          acc.id === tx.accountId ? { ...acc, balance: acc.balance - delta } : acc
        ));
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const importTransactions = useCallback((txs: Transaction[]) => {
    setTransactions(prev => [...txs, ...prev]);
    setAccounts(prev =>
      prev.map(acc => {
        const delta = txs
          .filter(t => t.accountId === acc.id)
          .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
        return delta !== 0 ? { ...acc, balance: acc.balance + delta } : acc;
      })
    );
  }, []);

  // Category CRUD
  const addCategory = useCallback((cat: Category) => {
    setCategories(prev => [...prev, cat]);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    // Update category reference in transactions
    setTransactions(prev => prev.map(t =>
      t.category.id === id ? { ...t, category: { ...t.category, ...updates } } : t
    ));
  }, []);

  const archiveCategory = useCallback((id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c));
  }, []);

  const unarchiveCategory = useCallback((id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: false } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id));
  }, []);

  const reassignTransactions = useCallback((fromCategoryId: string, toCategoryId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.category.id === fromCategoryId) {
        const newCat = categories.find(c => c.id === toCategoryId);
        if (newCat) return { ...t, category: newCat };
      }
      return t;
    }));
  }, [categories]);

  const getTransactionCountByCategory = useCallback((categoryId: string) => {
    return transactions.filter(t => t.category.id === categoryId).length;
  }, [transactions]);

  const getRootCategories = useCallback((type?: "income" | "expense") => {
    return categories.filter(c =>
      !c.parentId && !c.archived && (type ? c.type === type : true)
    );
  }, [categories]);

  const getSubcategories = useCallback((parentId: string) => {
    return categories.filter(c => c.parentId === parentId && !c.archived);
  }, [categories]);

  const getArchivedCategories = useCallback(() => {
    return categories.filter(c => c.archived);
  }, [categories]);

  const getAllActiveCategories = useCallback((type?: "income" | "expense") => {
    return categories.filter(c => !c.archived && (type ? c.type === type : true));
  }, [categories]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === "expense" && t.date.getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncome = transactions
    .filter(t => t.type === "income" && t.date.getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyBudget = 150;
  const todaySpent = transactions
    .filter(t => t.type === "expense" && t.date.toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    transactions,
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    addCategory,
    updateCategory,
    archiveCategory,
    unarchiveCategory,
    deleteCategory,
    reassignTransactions,
    getTransactionCountByCategory,
    getRootCategories,
    getSubcategories,
    getArchivedCategories,
    getAllActiveCategories,
    totalBalance,
    monthlyExpenses,
    monthlyIncome,
    dailyBudget,
    todaySpent,
  };
}
