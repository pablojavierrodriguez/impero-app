import { useState, useCallback, useEffect } from "react";
import {
  Transaction, Account, DEFAULT_ACCOUNTS,
  Category, CATEGORIES, getStatementPeriod, getPreviousStatementPeriod,
  Budget, Goal, RecurringTransaction, BillReminder, Tag, TransactionRule,
  type RecurrenceFrequency,
} from "./types";
import { applyRulesToTransaction } from "./rules-engine";
import { useAuth } from "./auth-context";
import { fetchAccounts, insertAccount, updateAccountRemote, deleteAccountRemote } from "@/services/accounts.service";
import { fetchCategories, insertCategory, updateCategoryRemote, deleteCategoryRemote } from "@/services/categories.service";
import { fetchTransactions, insertTransaction, insertTransactionsBatch, updateTransactionRemote, deleteTransactionRemote, deleteTransactionsByGroupIdRemote } from "@/services/transactions.service";
import { fetchBudgets, insertBudget, updateBudgetRemote, deleteBudgetRemote, fetchGoals, insertGoal, updateGoalRemote, deleteGoalRemote, fetchBills, insertBill, updateBillRemote, deleteBillRemote } from "@/services/planning.service";

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
  const { user } = useAuth();
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTxs, setRecurringTxs] = useState<RecurringTransaction[]>(() => loadJSON("recurring", []));
  const [bills, setBills] = useState<BillReminder[]>([]);
  const [tags, setTags] = useState<Tag[]>(() => loadJSON("tags", []));
  const [rules, setRules] = useState<TransactionRule[]>(() => loadJSON("m3-transaction-rules", []));

  const saveRules = useCallback((newRules: TransactionRule[]) => {
    setRules(newRules);
    saveJSON("m3-transaction-rules", newRules);
  }, []);

  // Cargar datos desde Supabase al autenticarse
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setBills([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [accs, cats, bds, gls, bls] = await Promise.all([
          fetchAccounts(),
          fetchCategories(),
          fetchBudgets(),
          fetchGoals(),
          fetchBills(),
        ]);

        if (!isMounted) return;

        setAccounts(accs);
        setCategories(cats);
        setBudgets(bds);
        setGoals(gls);
        setBills(bls);

        // Fetch transactions with resolved categories
        const txs = await fetchTransactions(cats);
        if (!isMounted) return;
        setTransactions(txs);
      } catch (err) {
        console.error("Error loading Supabase financial data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [user]);

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
    extras?: { tags?: string[]; note?: string; installments?: number; receiptUrl?: string }
  ) => {
    // Aplicar motor de automatizaciones y reglas (P10)
    const evaluated = applyRulesToTransaction(
      {
        amount,
        description,
        category,
        type,
        accountId,
        tags: extras?.tags,
        note: extras?.note,
      },
      rules,
      categories
    );

    const effDesc = evaluated.description;
    const effCategory = evaluated.category;
    const effTags = evaluated.tags;

    if (extras?.installments && extras.installments > 1) {
      const groupId = Date.now().toString();
      const perInstallment = amount / extras.installments;
      const targetAccount = accounts.find(a => a.id === accountId);
      const isCredit = targetAccount?.type === "credit";
      const closingDay = targetAccount?.closingDay || 15;

      const now = new Date();
      // Si la tarjeta cerró este mes (día actual > closingDay), la primera cuota vence en el resumen siguiente (+1 mes)
      const shouldShiftNextMonth = isCredit && now.getDate() > closingDay;

      const newTxsToInsert: Omit<Transaction, "id">[] = [];
      for (let i = 0; i < extras.installments; i++) {
        const txDate = new Date();
        const monthOffset = (shouldShiftNextMonth ? 1 : 0) + i;
        txDate.setMonth(txDate.getMonth() + monthOffset);
        newTxsToInsert.push({
          amount: perInstallment,
          description: `${effDesc} (${i + 1}/${extras.installments})`,
          category: effCategory, date: txDate, type, accountId,
          tags: effTags, note: extras?.note, receiptUrl: extras?.receiptUrl,
          installmentInfo: { current: i + 1, total: extras.installments, groupId },
        });
      }

      insertTransactionsBatch(newTxsToInsert)
        .then(() => fetchTransactions(categories).then(setTransactions))
        .catch(err => console.error("Error inserting installments batch:", err));
    } else {
      const newTx: Omit<Transaction, "id"> = {
        amount, description: effDesc, category: effCategory, date: new Date(), type, accountId,
        tags: effTags, note: extras?.note, receiptUrl: extras?.receiptUrl,
      };

      insertTransaction(newTx)
        .then((inserted) => setTransactions(prev => [inserted, ...prev]))
        .catch(err => console.error("Error inserting transaction:", err));
    }

    // Actualizar balance de la cuenta
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        const newBal = acc.type === "credit"
          ? (type === "expense" ? acc.balance + amount : acc.balance - amount)
          : (type === "income" ? acc.balance + amount : acc.balance - amount);
        updateAccountRemote(acc.id, { balance: newBal }).catch(err => console.error(err));
        return { ...acc, balance: newBal };
      }
      return acc;
    }));
  }, [categories]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    updateTransactionRemote(id, updates).catch(err => console.error(err));
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        if (updates.amount !== undefined && updates.amount !== t.amount) {
          const diff = updates.amount - t.amount;
          setAccounts(accs => accs.map(acc => {
            if (acc.id === updated.accountId) {
              const newBal = updated.type === "income" ? acc.balance + diff : acc.balance - diff;
              updateAccountRemote(acc.id, { balance: newBal }).catch(console.error);
              return { ...acc, balance: newBal };
            }
            return acc;
          }));
        }
        return updated;
      }
      return t;
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    deleteTransactionRemote(id).catch(err => console.error(err));
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id);
      if (tx) {
        setAccounts(accs => accs.map(acc => {
          if (acc.id === tx.accountId) {
            const newBal = tx.type === "income" ? acc.balance - tx.amount : acc.balance + tx.amount;
            updateAccountRemote(acc.id, { balance: newBal }).catch(console.error);
            return { ...acc, balance: newBal };
          }
          return acc;
        }));
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const deleteInstallmentGroup = useCallback((groupId: string) => {
    deleteTransactionsByGroupIdRemote(groupId).catch(err => console.error(err));
    setTransactions(prev => {
      const groupTxs = prev.filter(t => t.installmentInfo?.groupId === groupId);
      if (groupTxs.length > 0) {
        // Calcular total a revertir por cuenta
        const deltas = new Map<string, number>();
        for (const tx of groupTxs) {
          const current = deltas.get(tx.accountId) || 0;
          const change = tx.type === "income" ? -tx.amount : tx.amount;
          deltas.set(tx.accountId, current + change);
        }
        setAccounts(accs => accs.map(acc => {
          const delta = deltas.get(acc.id);
          if (delta !== undefined && delta !== 0) {
            const newBal = acc.balance + delta;
            updateAccountRemote(acc.id, { balance: newBal }).catch(console.error);
            return { ...acc, balance: newBal };
          }
          return acc;
        }));
      }
      return prev.filter(t => t.installmentInfo?.groupId !== groupId);
    });
  }, []);

  const duplicateTransaction = useCallback((tx: Transaction) => {
    addTransaction(tx.amount, `${tx.description} (copia)`, tx.category, tx.type, tx.accountId, {
      tags: tx.tags, note: tx.note, receiptUrl: tx.receiptUrl,
    });
  }, [addTransaction]);

  const importTransactions = useCallback(async (newTxs: Transaction[]) => {
    if (newTxs.length === 0) return;

    const toInsert = newTxs.map(t => ({
      amount: t.amount,
      description: t.description,
      category: t.category,
      date: t.date,
      type: t.type,
      accountId: t.accountId,
      isTransfer: t.isTransfer || false,
      isCardPayment: t.isCardPayment || false,
      installmentInfo: t.installmentInfo,
      tags: t.tags,
      note: t.note,
      receiptUrl: t.receiptUrl,
    }));

    await insertTransactionsBatch(toInsert);
    const updatedTransactions = await fetchTransactions(categories);
    setTransactions(updatedTransactions);

    // Calcular impacto neto por cuenta
    const accountDeltas = new Map<string, number>();
    for (const tx of newTxs) {
      const current = accountDeltas.get(tx.accountId) || 0;
      const change = tx.type === "income" ? tx.amount : -tx.amount;
      accountDeltas.set(tx.accountId, current + change);
    }

    // Actualizar balance local y remoto de las cuentas afectadas
    setAccounts(prev =>
      prev.map(acc => {
        const delta = accountDeltas.get(acc.id);
        if (delta !== undefined && delta !== 0) {
          const newBal = acc.type === "credit"
            ? acc.balance - delta // para tarjetas, un gasto incrementa el balance adeudado
            : acc.balance + delta;
          updateAccountRemote(acc.id, { balance: newBal }).catch(console.error);
          return { ...acc, balance: newBal };
        }
        return acc;
      })
    );
  }, [categories]);

  // ===== CATEGORIES =====
  const addCategory = useCallback((cat: Category) => {
    insertCategory(cat)
      .then(inserted => setCategories(prev => [...prev, inserted]))
      .catch(console.error);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    updateCategoryRemote(id, updates).catch(console.error);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setTransactions(prev => prev.map(t => t.category.id === id ? { ...t, category: { ...t.category, ...updates } } : t));
  }, []);

  const archiveCategory = useCallback((id: string) => {
    updateCategoryRemote(id, { archived: true }).catch(console.error);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c));
  }, []);

  const unarchiveCategory = useCallback((id: string) => {
    updateCategoryRemote(id, { archived: false }).catch(console.error);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: false } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    deleteCategoryRemote(id).catch(console.error);
    setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id));
  }, []);

  const reassignTransactions = useCallback((fromCategoryId: string, toCategoryId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.category.id === fromCategoryId) {
        const newCat = categories.find(c => c.id === toCategoryId);
        if (newCat) {
          updateTransactionRemote(t.id, { category: newCat }).catch(console.error);
          return { ...t, category: newCat };
        }
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
  const addAccount = useCallback((account: Account) => {
    insertAccount(account)
      .then(inserted => setAccounts(prev => [...prev, inserted]))
      .catch(console.error);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    updateAccountRemote(id, updates).catch(console.error);
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const archiveAccount = useCallback((id: string) => {
    updateAccountRemote(id, { archived: true }).catch(console.error);
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, archived: true } : a));
  }, []);

  const unarchiveAccount = useCallback((id: string) => {
    updateAccountRemote(id, { archived: false }).catch(console.error);
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, archived: false } : a));
  }, []);

  const adjustAccountBalance = useCallback((accountId: string, newBalance: number) => {
    setAccounts(prev => {
      const account = prev.find(a => a.id === accountId);
      if (!account) return prev;
      const diff = newBalance - account.balance;
      if (diff === 0) return prev;
      updateAccountRemote(accountId, { balance: newBalance }).catch(console.error);
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

  const transferBetweenAccounts = useCallback((fromAccountId: string, toAccountId: string, amount: number, targetAmount?: number) => {
    setAccounts(prev => {
      const from = prev.find(a => a.id === fromAccountId);
      const to = prev.find(a => a.id === toAccountId);
      if (!from || !to || amount <= 0) return prev;
      const creditAmount = (targetAmount !== undefined && targetAmount > 0) ? targetAmount : amount;
      const transferCategory: Category = { id: "transfer", name: "Transfer", color: "bg-sky-500", type: "expense", icon: "arrow-left-right" };
      const outTx: Transaction = {
        id: `tf-out-${Date.now()}`, amount, description: `Transfer to ${to.name}`,
        category: { ...transferCategory, type: "expense" }, date: new Date(), type: "expense",
        accountId: fromAccountId, isTransfer: true,
      };
      const inTx: Transaction = {
        id: `tf-in-${Date.now()}`, amount: creditAmount, description: `Transfer from ${from.name}`,
        category: { ...transferCategory, type: "income" }, date: new Date(), type: "income",
        accountId: toAccountId, isTransfer: true,
      };
      setTransactions(txPrev => [outTx, inTx, ...txPrev]);
      return prev.map(a => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
        if (a.id === toAccountId) return { ...a, balance: a.balance + creditAmount };
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
    insertBudget(budget)
      .then(inserted => setBudgets(prev => [...prev, inserted]))
      .catch(console.error);
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    updateBudgetRemote(id, updates).catch(console.error);
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    deleteBudgetRemote(id).catch(console.error);
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  const getBudgetSpent = useCallback((categoryId: string, month: number, year: number) => {
    return transactions
      .filter(t => t.category.id === categoryId && t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === month && t.date.getFullYear() === year)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getCurrentMonthBudgets = useCallback(() => {
    const m = now.getMonth();
    const y = now.getFullYear();
    return budgets.filter(b => b.month === m && b.year === y);
  }, [budgets, now]);

  // ===== GOALS =====
  const addGoal = useCallback((goal: Goal) => {
    insertGoal(goal)
      .then(inserted => setGoals(prev => [inserted, ...prev]))
      .catch(console.error);
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    updateGoalRemote(id, updates).catch(console.error);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    deleteGoalRemote(id).catch(console.error);
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const contributeToGoal = useCallback((id: string, amount: number, accountId?: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const next = g.currentAmount + amount;
      const completed = next >= g.targetAmount;
      updateGoalRemote(id, { currentAmount: next, completed }).catch(console.error);
      return { ...g, currentAmount: next, completed };
    }));

    if (accountId) {
      setAccounts(prev => prev.map(a => {
        if (a.id === accountId) {
          const newBal = a.balance - amount;
          updateAccountRemote(a.id, { balance: newBal }).catch(console.error);
          return { ...a, balance: newBal };
        }
        return a;
      }));
    }
  }, []);

  const withdrawFromGoal = useCallback((id: string, amount: number, accountId?: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const next = Math.max(0, g.currentAmount - amount);
      const completed = next >= g.targetAmount;
      updateGoalRemote(id, { currentAmount: next, completed }).catch(console.error);
      return { ...g, currentAmount: next, completed };
    }));

    if (accountId) {
      setAccounts(prev => prev.map(a => {
        if (a.id === accountId) {
          const newBal = a.balance + amount;
          updateAccountRemote(a.id, { balance: newBal }).catch(console.error);
          return { ...a, balance: newBal };
        }
        return a;
      }));
    }
  }, []);

  // ===== BILLS =====
  const addBill = useCallback((bill: BillReminder) => {
    insertBill(bill)
      .then(inserted => setBills(prev => [...prev, inserted]))
      .catch(console.error);
  }, []);

  const updateBill = useCallback((id: string, updates: Partial<BillReminder>) => {
    updateBillRemote(id, updates).catch(console.error);
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBill = useCallback((id: string) => {
    deleteBillRemote(id).catch(console.error);
    setBills(prev => prev.filter(b => b.id !== id));
  }, []);

  const markBillPaid = useCallback((id: string, accountId: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    // Create expense transaction
    const cat = categories.find(c => c.id === bill.categoryId) ||
      { id: "bills", name: "Servicios/Facturas", color: "bg-red-400", type: "expense" as const, icon: "file-text" };
    
    addTransaction(bill.amount, bill.name, cat, "expense", accountId);

    // Update bill: mark paid and advance due date
    const nextDue = getNextDate(new Date(bill.dueDate), bill.frequency);
    updateBillRemote(id, { status: "paid", dueDate: nextDue }).catch(console.error);
    setBills(prev => prev.map(b => b.id === id ? { ...b, status: "paid" as const, dueDate: nextDue } : b));
  }, [bills, categories, addTransaction]);

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
        const tx: Transaction = {
          id: `rec-${Date.now()}-${r.id}`,
          amount: r.amount,
          description: r.description,
          category: r.category,
          date: new Date(),
          type: r.type,
          accountId: r.accountId,
          recurringId: r.id,
          tags: r.tags,
        };
        addTransaction(tx.amount, tx.description, tx.category, tx.type, tx.accountId, {
          tags: tx.tags,
        });
        updated = true;
        return { ...r, nextDate: getNextDate(nextDate, r.frequency) };
      }
      return r;
    });
    if (updated) saveRecurring(newRecurring);
  }, [recurringTxs, addTransaction]);

  // ===== TAGS =====
  const addTag = useCallback((tag: Tag) => { saveTags([...tags, tag]); }, [tags]);
  const updateTag = useCallback((id: string, updates: Partial<Tag>) => { saveTags(tags.map(t => t.id === id ? { ...t, ...updates } : t)); }, [tags]);
  const deleteTag = useCallback((id: string) => { saveTags(tags.filter(t => t.id !== id)); }, [tags]);

  const getTransactionCountByTag = useCallback((tagId: string) => {
    return transactions.filter(t => t.tags?.includes(tagId)).length;
  }, [transactions]);

  // ===== COMPUTED =====
  const totalBalance = accounts.filter(a => !a.archived).reduce((sum, acc) => sum + acc.balance, 0);

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

  // ===== RULES ENGINE (P10) =====
  const addRule = useCallback((rule: TransactionRule) => {
    saveRules([...rules, rule]);
  }, [rules, saveRules]);

  const updateRule = useCallback((id: string, updates: Partial<TransactionRule>) => {
    saveRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  }, [rules, saveRules]);

  const deleteRule = useCallback((id: string) => {
    saveRules(rules.filter(r => r.id !== id));
  }, [rules, saveRules]);

  const toggleRule = useCallback((id: string) => {
    saveRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, [rules, saveRules]);

  const applyRulesRetroactively = useCallback(() => {
    setTransactions(prev => {
      return prev.map(tx => {
        const evaluated = applyRulesToTransaction(
          {
            amount: tx.amount,
            description: tx.description,
            category: tx.category,
            type: tx.type,
            accountId: tx.accountId,
            tags: tx.tags,
            note: tx.note,
          },
          rules,
          categories
        );
        return {
          ...tx,
          category: evaluated.category,
          description: evaluated.description,
          tags: evaluated.tags,
        };
      });
    });
  }, [rules, categories]);

  return {
    loading,
    transactions, accounts, categories, budgets, goals, recurringTxs, bills, tags, rules,
    addTransaction, updateTransaction, deleteTransaction, deleteInstallmentGroup, duplicateTransaction, importTransactions,
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
    addRule, updateRule, deleteRule, toggleRule, applyRulesRetroactively,
    totalBalance, monthlyExpenses, monthlyIncome, todaySpent, weekSpent,
    getMonthlyTrend, getLastMonthExpenses,
  };
}
