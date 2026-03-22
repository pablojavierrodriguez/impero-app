import { useState, useCallback } from "react";
import { Transaction, Account, DEFAULT_ACCOUNTS, SAMPLE_TRANSACTIONS, Category, CATEGORIES, getStatementPeriod, getPreviousStatementPeriod } from "./types";

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

  // Account CRUD
  const addAccount = useCallback((account: Account) => {
    setAccounts(prev => [...prev, account]);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const archiveAccount = useCallback((id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, archived: true } : a));
  }, []);

  const unarchiveAccount = useCallback((id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, archived: false } : a));
  }, []);

  const adjustAccountBalance = useCallback((accountId: string, newBalance: number) => {
    setAccounts(prev => {
      const account = prev.find(a => a.id === accountId);
      if (!account) return prev;
      const diff = newBalance - account.balance;
      if (diff === 0) return prev;

      const adjustmentCategory: Category = diff > 0
        ? { id: "adjustment-income", name: "Balance Adjustment", color: "bg-emerald-400", type: "income", icon: "arrow-up-down" }
        : { id: "adjustment-expense", name: "Balance Adjustment", color: "bg-zinc-500", type: "expense", icon: "arrow-up-down" };

      const adjustmentTx: Transaction = {
        id: `adj-${Date.now()}`,
        amount: Math.abs(diff),
        description: `Balance adjustment: ${account.name}`,
        category: adjustmentCategory,
        date: new Date(),
        type: diff > 0 ? "income" : "expense",
        accountId,
      };

      setTransactions(txPrev => [adjustmentTx, ...txPrev]);
      return prev.map(a => a.id === accountId ? { ...a, balance: newBalance } : a);
    });
  }, []);

  // Credit card payment: transfer from source account to card
  const payCard = useCallback((cardId: string, fromAccountId: string, amount: number) => {
    setAccounts(prev => {
      const card = prev.find(a => a.id === cardId);
      const source = prev.find(a => a.id === fromAccountId);
      if (!card || !source || amount <= 0) return prev;

      // Create payment transaction on source account (expense)
      const paymentTx: Transaction = {
        id: `pay-${Date.now()}`,
        amount,
        description: `Card payment: ${card.name}`,
        category: { id: "card-payment", name: "Card Payment", color: "bg-sky-500", type: "expense", icon: "credit-card" },
        date: new Date(),
        type: "expense",
        accountId: fromAccountId,
        isCardPayment: true,
      };

      // Create income transaction on card (reduces negative balance)
      const cardTx: Transaction = {
        id: `pay-recv-${Date.now()}`,
        amount,
        description: `Payment from ${source.name}`,
        category: { id: "card-payment-recv", name: "Card Payment", color: "bg-sky-500", type: "income", icon: "credit-card" },
        date: new Date(),
        type: "income",
        accountId: cardId,
        isCardPayment: true,
      };

      setTransactions(txPrev => [paymentTx, cardTx, ...txPrev]);

      return prev.map(a => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
        if (a.id === cardId) return { ...a, balance: a.balance + amount };
        return a;
      });
    });
  }, []);

  // Transfer between own accounts
  const transferBetweenAccounts = useCallback((fromAccountId: string, toAccountId: string, amount: number) => {
    setAccounts(prev => {
      const from = prev.find(a => a.id === fromAccountId);
      const to = prev.find(a => a.id === toAccountId);
      if (!from || !to || amount <= 0) return prev;

      const transferCategory: Category = {
        id: "transfer", name: "Transfer", color: "bg-sky-500", type: "expense", icon: "arrow-left-right"
      };

      const outTx: Transaction = {
        id: `tf-out-${Date.now()}`,
        amount,
        description: `Transfer to ${to.name}`,
        category: { ...transferCategory, type: "expense" },
        date: new Date(),
        type: "expense",
        accountId: fromAccountId,
        isTransfer: true,
      };

      const inTx: Transaction = {
        id: `tf-in-${Date.now()}`,
        amount,
        description: `Transfer from ${from.name}`,
        category: { ...transferCategory, type: "income" },
        date: new Date(),
        type: "income",
        accountId: toAccountId,
        isTransfer: true,
      };

      setTransactions(txPrev => [outTx, inTx, ...txPrev]);

      return prev.map(a => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
        if (a.id === toAccountId) return { ...a, balance: a.balance + amount };
        return a;
      });
    });
  }, []);

  // Get statement transactions for a credit card
  const getStatementTransactions = useCallback((cardId: string, period: "current" | "previous" = "current") => {
    const card = accounts.find(a => a.id === cardId);
    if (!card || !card.closingDay) return [];

    const { periodStart, periodEnd } = period === "current"
      ? getStatementPeriod(card.closingDay)
      : getPreviousStatementPeriod(card.closingDay);

    return transactions.filter(t =>
      t.accountId === cardId &&
      t.type === "expense" &&
      !t.isCardPayment &&
      t.date >= periodStart &&
      t.date <= periodEnd
    );
  }, [accounts, transactions]);

  const getActiveAccounts = useCallback(() => {
    return accounts.filter(a => !a.archived);
  }, [accounts]);

  const getArchivedAccounts = useCallback(() => {
    return accounts.filter(a => a.archived);
  }, [accounts]);

  const getCreditCards = useCallback(() => {
    return accounts.filter(a => a.type === "credit" && !a.archived);
  }, [accounts]);

  const getTransactionsByAccount = useCallback((accountId: string) => {
    return transactions.filter(t => t.accountId === accountId);
  }, [transactions]);

  const getNonCardAccounts = useCallback(() => {
    return accounts.filter(a => a.type !== "credit" && !a.archived);
  }, [accounts]);

  const totalBalance = accounts.filter(a => !a.archived).reduce((sum, acc) => sum + acc.balance, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && t.date.getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncome = transactions
    .filter(t => t.type === "income" && !t.isCardPayment && t.date.getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyBudget = 150;
  const todaySpent = transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && t.date.toDateString() === new Date().toDateString())
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
    addAccount,
    updateAccount,
    archiveAccount,
    unarchiveAccount,
    adjustAccountBalance,
    payCard,
    getStatementTransactions,
    getActiveAccounts,
    getArchivedAccounts,
    getCreditCards,
    getNonCardAccounts,
    getTransactionsByAccount,
    totalBalance,
    monthlyExpenses,
    monthlyIncome,
    dailyBudget,
    todaySpent,
  };
}
