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
