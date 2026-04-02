import { useState, useCallback } from "react";
import {
  Transaction, Account, DEFAULT_ACCOUNTS, SAMPLE_TRANSACTIONS,
  Category, CATEGORIES, getStatementPeriod, getPreviousStatementPeriod,
  Budget, Goal, RecurringTransaction, BillReminder, Tag,
  type RecurrenceFrequency,
} from "./types";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
}

function saveJSON(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getNextDate(from: Date, freq: RecurrenceFrequency): Date {
  const d = new Date(from);
  switch (freq) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export function useFinanceStore() {
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>(() => loadJSON("budgets", []));
  const [goals, setGoals] = useState<Goal[]>(() => loadJSON("goals", []));
  const [recurringTxs, setRecurringTxs] = useState<RecurringTransaction[]>(() => loadJSON("recurring", []));
  const [bills, setBills] = useState<BillReminder[]>(() => loadJSON("bills", []));
  const [tags, setTags] = useState<Tag[]>(() => loadJSON("tags", []));

  // Persist helpers
  const saveBudgets = (b: Budget[]) => { setBudgets(b); saveJSON("budgets", b); };
  const saveGoals = (g: Goal[]) => { setGoals(g); saveJSON("goals", g); };
  const saveRecurring = (r: RecurringTransaction[]) => { setRecurringTxs(r); saveJSON("recurring", r); };
  const saveBills = (b: BillReminder[]) => { setBills(b); saveJSON("bills", b); };
  const saveTags = (t: Tag[]) => { setTags(t); saveJSON("tags", t); };

  // ===== TRANSACTIONS =====
  const addTransaction = useCallback((
    amount: number, description: string, category: Category,
    type: "income" | "expense", accountId: string,
    extras?: { tags?: string[]; note?: string; installments?: number }
  ) => {
    if (extras?.installments && extras.installments > 1) {
      const groupId = Date.now().toString();
      const perInstallment = amount / extras.installments;
      const newTxs: Transaction[] = [];
      for (let i = 0; i < extras.installments; i++) {
        const txDate = new Date();
        txDate.setMonth(txDate.getMonth() + i);
        newTxs.push({
          id: `${groupId}-${i}`,
          amount: perInstallment,
          description: `${description} (${i + 1}/${extras.installments})`,
          category, date: txDate, type, accountId,
          tags: extras?.tags, note: extras?.note,
          installmentInfo: { current: i + 1, total: extras.installments, groupId },
        });
      }
      setTransactions(prev => [...newTxs, ...prev]);
      // Only affect balance for first installment
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? { ...acc, balance: acc.balance + (type === "income" ? perInstallment : -perInstallment) } : acc
      ));
      return;
    }

    const newTx: Transaction = {
      id: Date.now().toString(), amount, description, category,
      date: new Date(), type, accountId,
      tags: extras?.tags, note: extras?.note,
    };
    setTransactions(prev => [newTx, ...prev]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== accountId) return acc;
      return { ...acc, balance: acc.balance + (type === "income" ? amount : -amount) };
    }));
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

  const duplicateTransaction = useCallback((id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const newTx: Transaction = {
      ...tx, id: Date.now().toString(), date: new Date(),
    };
    setTransactions(prev => [newTx, ...prev]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== newTx.accountId) return acc;
      return { ...acc, balance: acc.balance + (newTx.type === "income" ? newTx.amount : -newTx.amount) };
    }));
  }, [transactions]);

  const importTransactions = useCallback((txs: Transaction[]) => {
    setTransactions(prev => [...txs, ...prev]);
    setAccounts(prev => prev.map(acc => {
      const delta = txs.filter(t => t.accountId === acc.id)
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
      return delta !== 0 ? { ...acc, balance: acc.balance + delta } : acc;
    }));
  }, []);

  // ===== CATEGORIES =====
  const addCategory = useCallback((cat: Category) => { setCategories(prev => [...prev, cat]); }, []);
  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setTransactions(prev => prev.map(t => t.category.id === id ? { ...t, category: { ...t.category, ...updates } } : t));
  }, []);
  const archiveCategory = useCallback((id: string) => { setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c)); }, []);
  const unarchiveCategory = useCallback((id: string) => { setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: false } : c)); }, []);
  const deleteCategory = useCallback((id: string) => { setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id)); }, []);
  const reassignTransactions = useCallback((fromCategoryId: string, toCategoryId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.category.id === fromCategoryId) {
        const newCat = categories.find(c => c.id === toCategoryId);
        if (newCat) return { ...t, category: newCat };
      }
      return t;
    }));
  }, [categories]);

  const getTransactionCountByCategory = useCallback((categoryId: string) => transactions.filter(t => t.category.id === categoryId).length, [transactions]);
  const getRootCategories = useCallback((type?: "income" | "expense") => categories.filter(c => !c.parentId && !c.archived && (type ? c.type === type : true)), [categories]);
  const getSubcategories = useCallback((parentId: string) => categories.filter(c => c.parentId === parentId && !c.archived), [categories]);
  const getArchivedCategories = useCallback(() => categories.filter(c => c.archived), [categories]);
  const getAllActiveCategories = useCallback((type?: "income" | "expense") => categories.filter(c => !c.archived && (type ? c.type === type : true)), [categories]);

  // ===== ACCOUNTS =====
  const addAccount = useCallback((account: Account) => { setAccounts(prev => [...prev, account]); }, []);
  const updateAccount = useCallback((id: string, updates: Partial<Account>) => { setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a)); }, []);
  const archiveAccount = useCallback((id: string) => { setAccounts(prev => prev.map(a => a.id === id ? { ...a, archived: true } : a)); }, []);
  const unarchiveAccount = useCallback((id: string) => { setAccounts(prev => prev.map(a => a.id === id ? { ...a, archived: false } : a)); }, []);

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
        id: `adj-${Date.now()}`, amount: Math.abs(diff), description: `Balance adjustment: ${account.name}`,
        category: adjustmentCategory, date: new Date(), type: diff > 0 ? "income" : "expense", accountId,
      };
      setTransactions(txPrev => [adjustmentTx, ...txPrev]);
      return prev.map(a => a.id === accountId ? { ...a, balance: newBalance } : a);
    });
  }, []);

  const payCard = useCallback((cardId: string, fromAccountId: string, amount: number) => {
    setAccounts(prev => {
      const card = prev.find(a => a.id === cardId);
      const source = prev.find(a => a.id === fromAccountId);
      if (!card || !source || amount <= 0) return prev;
      const paymentTx: Transaction = {
        id: `pay-${Date.now()}`, amount, description: `Card payment: ${card.name}`,
        category: { id: "card-payment", name: "Card Payment", color: "bg-sky-500", type: "expense", icon: "credit-card" },
        date: new Date(), type: "expense", accountId: fromAccountId, isCardPayment: true,
      };
      const cardTx: Transaction = {
        id: `pay-recv-${Date.now()}`, amount, description: `Payment from ${source.name}`,
        category: { id: "card-payment-recv", name: "Card Payment", color: "bg-sky-500", type: "income", icon: "credit-card" },
        date: new Date(), type: "income", accountId: cardId, isCardPayment: true,
      };
      setTransactions(txPrev => [paymentTx, cardTx, ...txPrev]);
      return prev.map(a => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
        if (a.id === cardId) return { ...a, balance: a.balance + amount };
        return a;
      });
    });
  }, []);

  const transferBetweenAccounts = useCallback((fromAccountId: string, toAccountId: string, amount: number) => {
    setAccounts(prev => {
      const from = prev.find(a => a.id === fromAccountId);
      const to = prev.find(a => a.id === toAccountId);
      if (!from || !to || amount <= 0) return prev;
      const transferCategory: Category = { id: "transfer", name: "Transfer", color: "bg-sky-500", type: "expense", icon: "arrow-left-right" };
      const outTx: Transaction = {
        id: `tf-out-${Date.now()}`, amount, description: `Transfer to ${to.name}`,
        category: { ...transferCategory, type: "expense" }, date: new Date(), type: "expense",
        accountId: fromAccountId, isTransfer: true,
      };
      const inTx: Transaction = {
        id: `tf-in-${Date.now()}`, amount, description: `Transfer from ${from.name}`,
        category: { ...transferCategory, type: "income" }, date: new Date(), type: "income",
        accountId: toAccountId, isTransfer: true,
      };
      setTransactions(txPrev => [outTx, inTx, ...txPrev]);
      return prev.map(a => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
        if (a.id === toAccountId) return { ...a, balance: a.balance + amount };
        return a;
      });
    });
  }, []);

  const getStatementTransactions = useCallback((cardId: string, period: "current" | "previous" = "current") => {
    const card = accounts.find(a => a.id === cardId);
    if (!card || !card.closingDay) return [];
    const { periodStart, periodEnd } = period === "current"
      ? getStatementPeriod(card.closingDay) : getPreviousStatementPeriod(card.closingDay);
    return transactions.filter(t =>
      t.accountId === cardId && t.type === "expense" && !t.isCardPayment && t.date >= periodStart && t.date <= periodEnd
    );
  }, [accounts, transactions]);

  const getActiveAccounts = useCallback(() => accounts.filter(a => !a.archived), [accounts]);
  const getArchivedAccounts = useCallback(() => accounts.filter(a => a.archived), [accounts]);
  const getCreditCards = useCallback(() => accounts.filter(a => a.type === "credit" && !a.archived), [accounts]);
  const getTransactionsByAccount = useCallback((accountId: string) => transactions.filter(t => t.accountId === accountId), [transactions]);
  const getNonCardAccounts = useCallback(() => accounts.filter(a => a.type !== "credit" && !a.archived), [accounts]);

  // ===== BUDGETS =====
  const addBudget = useCallback((budget: Budget) => {
    saveBudgets([...budgets, budget]);
  }, [budgets]);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    saveBudgets(budgets.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [budgets]);

  const deleteBudget = useCallback((id: string) => {
    saveBudgets(budgets.filter(b => b.id !== id));
  }, [budgets]);

  const getBudgetSpent = useCallback((categoryId: string, month: number, year: number) => {
    return transactions.filter(t =>
      t.type === "expense" && !t.isCardPayment && !t.isTransfer &&
      t.category.id === categoryId &&
      t.date.getMonth() === month && t.date.getFullYear() === year
    ).reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getCurrentMonthBudgets = useCallback(() => {
    const now = new Date();
    return budgets.filter(b => b.month === now.getMonth() && b.year === now.getFullYear());
  }, [budgets]);

  // ===== GOALS =====
  const addGoal = useCallback((goal: Goal) => {
    saveGoals([...goals, goal]);
  }, [goals]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  }, [goals]);

  const deleteGoal = useCallback((id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  }, [goals]);

  const contributeToGoal = useCallback((id: string, amount: number) => {
    saveGoals(goals.map(g => {
      if (g.id !== id) return g;
      const newAmount = g.currentAmount + amount;
      return { ...g, currentAmount: newAmount, completed: newAmount >= g.targetAmount };
    }));
  }, [goals]);

  const withdrawFromGoal = useCallback((id: string, amount: number) => {
    saveGoals(goals.map(g => {
      if (g.id !== id) return g;
      const newAmount = Math.max(0, g.currentAmount - amount);
      return { ...g, currentAmount: newAmount, completed: false };
    }));
  }, [goals]);

  // ===== RECURRING TRANSACTIONS =====
  const addRecurringTx = useCallback((rtx: RecurringTransaction) => {
    saveRecurring([...recurringTxs, rtx]);
  }, [recurringTxs]);

  const updateRecurringTx = useCallback((id: string, updates: Partial<RecurringTransaction>) => {
    saveRecurring(recurringTxs.map(r => r.id === id ? { ...r, ...updates } : r));
  }, [recurringTxs]);

  const deleteRecurringTx = useCallback((id: string) => {
    saveRecurring(recurringTxs.filter(r => r.id !== id));
  }, [recurringTxs]);

  const toggleRecurringPause = useCallback((id: string) => {
    saveRecurring(recurringTxs.map(r => r.id === id ? { ...r, paused: !r.paused } : r));
  }, [recurringTxs]);

  const processRecurring = useCallback(() => {
    const now = new Date();
    let updated = false;
    const newRecurring = recurringTxs.map(r => {
      if (r.paused) return r;
      const nextDate = new Date(r.nextDate);
      if (nextDate <= now) {
        // Generate transaction
        const tx: Transaction = {
          id: `rec-${Date.now()}-${r.id}`, amount: r.amount,
          description: r.description, category: r.category,
          date: new Date(), type: r.type, accountId: r.accountId,
          recurringId: r.id, tags: r.tags,
        };
        setTransactions(prev => [tx, ...prev]);
        setAccounts(prev => prev.map(acc => {
          if (acc.id !== r.accountId) return acc;
          return { ...acc, balance: acc.balance + (r.type === "income" ? r.amount : -r.amount) };
        }));
        updated = true;
        return { ...r, nextDate: getNextDate(nextDate, r.frequency) };
      }
      return r;
    });
    if (updated) saveRecurring(newRecurring);
  }, [recurringTxs]);

  // ===== BILL REMINDERS =====
  const addBill = useCallback((bill: BillReminder) => {
    saveBills([...bills, bill]);
  }, [bills]);

  const updateBill = useCallback((id: string, updates: Partial<BillReminder>) => {
    saveBills(bills.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [bills]);

  const deleteBill = useCallback((id: string) => {
    saveBills(bills.filter(b => b.id !== id));
  }, [bills]);

  const markBillPaid = useCallback((id: string, accountId: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    // Create expense transaction
    const cat = categories.find(c => c.id === bill.categoryId) ||
      { id: "bills", name: "Bills", color: "bg-red-400", type: "expense" as const, icon: "file-text" };
    const tx: Transaction = {
      id: `bill-${Date.now()}`, amount: bill.amount, description: bill.name,
      category: cat, date: new Date(), type: "expense", accountId,
    };
    setTransactions(prev => [tx, ...prev]);
    setAccounts(prev => prev.map(acc =>
      acc.id === accountId ? { ...acc, balance: acc.balance - bill.amount } : acc
    ));
    // Update bill: mark paid and advance due date
    saveBills(bills.map(b => {
      if (b.id !== id) return b;
      const nextDue = getNextDate(new Date(b.dueDate), b.frequency);
      return { ...b, status: "paid" as const, dueDate: nextDue };
    }));
  }, [bills, categories]);

  const getPendingBills = useCallback(() => {
    const now = new Date();
    return bills.filter(b => {
      const due = new Date(b.dueDate);
      return b.status !== "paid" || due > now;
    }).map(b => {
      const due = new Date(b.dueDate);
      const status = b.status === "paid" ? "paid" : due < now ? "overdue" : "pending";
      return { ...b, status } as BillReminder;
    });
  }, [bills]);

  // ===== TAGS =====
  const addTag = useCallback((tag: Tag) => { saveTags([...tags, tag]); }, [tags]);
  const updateTag = useCallback((id: string, updates: Partial<Tag>) => { saveTags(tags.map(t => t.id === id ? { ...t, ...updates } : t)); }, [tags]);
  const deleteTag = useCallback((id: string) => { saveTags(tags.filter(t => t.id !== id)); }, [tags]);

  const getTransactionCountByTag = useCallback((tagId: string) => {
    return transactions.filter(t => t.tags?.includes(tagId)).length;
  }, [transactions]);

  // ===== COMPUTED =====
  const totalBalance = accounts.filter(a => !a.archived).reduce((sum, acc) => sum + acc.balance, 0);
  const now = new Date();

  const monthlyExpenses = transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncome = transactions
    .filter(t => t.type === "income" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);

  const todaySpent = transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && t.date.toDateString() === now.toDateString())
    .reduce((sum, t) => sum + t.amount, 0);

  const weekSpent = (() => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return transactions
      .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date >= weekStart)
      .reduce((sum, t) => sum + t.amount, 0);
  })();

  // Monthly data for last 6 months
  const getMonthlyTrend = useCallback(() => {
    const months: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTxs = transactions.filter(t => t.date.getMonth() === m && t.date.getFullYear() === y && !t.isCardPayment && !t.isTransfer);
      months.push({
        month: d.toLocaleString("default", { month: "short" }),
        income: monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expenses: monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions]);

  const getLastMonthExpenses = useCallback(() => {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const m = lastMonth.getMonth();
    const y = lastMonth.getFullYear();
    return transactions
      .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === m && t.date.getFullYear() === y)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  return {
    transactions, accounts, categories, budgets, goals, recurringTxs, bills, tags,
    addTransaction, updateTransaction, deleteTransaction, duplicateTransaction, importTransactions,
    addCategory, updateCategory, archiveCategory, unarchiveCategory, deleteCategory, reassignTransactions,
    getTransactionCountByCategory, getRootCategories, getSubcategories, getArchivedCategories, getAllActiveCategories,
    addAccount, updateAccount, archiveAccount, unarchiveAccount, adjustAccountBalance,
    payCard, transferBetweenAccounts, getStatementTransactions,
    getActiveAccounts, getArchivedAccounts, getCreditCards, getNonCardAccounts, getTransactionsByAccount,
    addBudget, updateBudget, deleteBudget, getBudgetSpent, getCurrentMonthBudgets,
    addGoal, updateGoal, deleteGoal, contributeToGoal, withdrawFromGoal,
    addRecurringTx, updateRecurringTx, deleteRecurringTx, toggleRecurringPause, processRecurring,
    addBill, updateBill, deleteBill, markBillPaid, getPendingBills,
    addTag, updateTag, deleteTag, getTransactionCountByTag,
    totalBalance, monthlyExpenses, monthlyIncome, todaySpent, weekSpent,
    getMonthlyTrend, getLastMonthExpenses,
  };
}
