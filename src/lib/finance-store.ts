import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Transaction, Account, DEFAULT_ACCOUNTS,
  Category, CATEGORIES, getStatementPeriod, getPreviousStatementPeriod, getOffsetStatementPeriod,
  Budget, Goal, RecurringTransaction, BillReminder, Tag, TransactionRule,
  type RecurrenceFrequency,
} from "./types";
import { Currency, DEFAULT_EXCHANGE_RATES } from "./settings-types";
import { applyRulesToTransaction } from "./rules-engine";
import { useAuth } from "./auth-context";
import { fetchAccounts, insertAccount, updateAccountRemote, deleteAccountRemote } from "@/services/accounts.service";
import { fetchCategories, insertCategory, updateCategoryRemote, deleteCategoryRemote, seedDefaultCategoriesRemote } from "@/services/categories.service";
import { fetchTransactions, insertTransaction, insertTransactionsBatch, updateTransactionRemote, deleteTransactionRemote, deleteTransactionsByGroupIdRemote } from "@/services/transactions.service";
import {
  fetchBudgets, insertBudget, updateBudgetRemote, deleteBudgetRemote,
  fetchGoals, insertGoal, updateGoalRemote, deleteGoalRemote,
  fetchBills, insertBill, updateBillRemote, deleteBillRemote,
  fetchRecurringTransactions, insertRecurringTransaction, updateRecurringTransactionRemote, deleteRecurringTransactionRemote
} from "@/services/planning.service";
import { fetchTags, insertTag, updateTagRemote, deleteTagRemote } from "@/services/tags.service";
import { fetchRules, insertRule, updateRuleRemote, deleteRuleRemote } from "@/services/rules.service";

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
    case "once": return d;
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
  const [recurringTxs, setRecurringTxs] = useState<RecurringTransaction[]>([]);
  const [bills, setBills] = useState<BillReminder[]>([]);
  const [tags, setTags] = useState<Tag[]>(() => loadJSON("tags", []));
  const RULES_STORAGE_KEY = "impero-transaction-rules";
  const LEGACY_RULES_STORAGE_KEY = "m3-transaction-rules";

  const [rules, setRules] = useState<TransactionRule[]>(() => {
    const modern = loadJSON<TransactionRule[] | null>(RULES_STORAGE_KEY, null);
    if (modern !== null) return modern;
    return loadJSON(LEGACY_RULES_STORAGE_KEY, []);
  });

  const saveRules = useCallback((newRules: TransactionRule[]) => {
    setRules(newRules);
    saveJSON(RULES_STORAGE_KEY, newRules);
  }, []);

  // Cargar datos desde Supabase al autenticarse
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setRecurringTxs([]);
      setBills([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [accs, cats, bds, gls, bls, remoteTags, remoteRules] = await Promise.all([
          fetchAccounts(),
          fetchCategories(),
          fetchBudgets(),
          fetchGoals(),
          fetchBills(),
          fetchTags().catch((err) => {
            console.warn("Could not fetch remote tags, using local:", err);
            return loadJSON<Tag[]>("tags", []);
          }),
          fetchRules().catch((err) => {
            console.warn("Could not fetch remote rules, using local:", err);
            const modern = loadJSON<TransactionRule[] | null>(RULES_STORAGE_KEY, null);
            if (modern !== null) return modern;
            return loadJSON<TransactionRule[]>(LEGACY_RULES_STORAGE_KEY, []);
          }),
        ]);

        if (!isMounted) return;

        setAccounts(accs);
        setCategories(cats);
        setBudgets(bds);
        setGoals(gls);
        setBills(bls);
        setTags(remoteTags);
        setRules(remoteRules);

        // Fetch transactions and recurring transactions with resolved categories
        const [txs, recTxs] = await Promise.all([
          fetchTransactions(cats),
          fetchRecurringTransactions(cats),
        ]);
        if (!isMounted) return;
        setTransactions(txs);
        setRecurringTxs(recTxs);
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
  const saveBills = (b: BillReminder[]) => { setBills(b); saveJSON("bills", b); };
  const saveTags = (t: Tag[]) => { setTags(t); saveJSON("tags", t); };

  // ===== TRANSACTIONS =====
  const addTransaction = useCallback((
    amount: number, description: string, category: Category,
    type: "income" | "expense", accountId: string,
    extras?: { tags?: string[]; note?: string; installments?: number; receiptUrl?: string; currency?: Currency; date?: Date }
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
    const targetAccount = accounts.find(a => a.id === accountId);
    const txCurrency: Currency = extras?.currency || targetAccount?.currency || "ARS";

    // Calcular impacto en balance (en la moneda de la cuenta)
    const accCurrency: Currency = targetAccount?.currency || "ARS";
    let effectiveAmountForAccount = amount;
    if (txCurrency !== accCurrency) {
      const rateFrom = DEFAULT_EXCHANGE_RATES[txCurrency] ?? 1;
      const rateTo = DEFAULT_EXCHANGE_RATES[accCurrency] ?? 1;
      const amountInArs = rateFrom > 0 ? amount / rateFrom : amount;
      effectiveAmountForAccount = amountInArs * rateTo;
    }

    const currentBalance = targetAccount?.balance ?? 0;
    const balanceDelta = targetAccount?.type === "credit"
      ? (type === "expense" ? effectiveAmountForAccount : -effectiveAmountForAccount)
      : (type === "income" ? effectiveAmountForAccount : -effectiveAmountForAccount);
    const newBalance = currentBalance + balanceDelta;

    // Actualización optimista del balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        updateAccountRemote(acc.id, { balance: newBalance }).catch(err => console.error(err));
        return { ...acc, balance: newBalance };
      }
      return acc;
    }));

    // Rollback automático si la inserción falla — evita divergencia entre balance y transacciones
    const rollback = () => {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === accountId) {
          updateAccountRemote(acc.id, { balance: currentBalance }).catch(console.error);
          return { ...acc, balance: currentBalance };
        }
        return acc;
      }));
    };

    if (extras?.installments && extras.installments > 1) {
      const groupId = Date.now().toString();
      const perInstallment = amount / extras.installments;
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
          currency: txCurrency,
          tags: effTags, note: extras?.note, receiptUrl: extras?.receiptUrl,
          installmentInfo: { current: i + 1, total: extras.installments, groupId },
        });
      }

      insertTransactionsBatch(newTxsToInsert)
        .then(() => fetchTransactions(categories).then(setTransactions))
        .catch(err => {
          console.error("[addTransaction] Error insertando cuotas:", err?.message || err, { accountId, amount, description });
          toast.error(`Error al guardar cuotas: ${err?.message || "Error desconocido"}`);
          rollback();
        });
    } else {
      // Usar la fecha especificada por el usuario (si existe) o la fecha actual
      const singleTxDate = extras?.date ? new Date(extras.date) : new Date();
      if (!extras?.date && targetAccount?.type === "credit" && type === "expense") {
        const closingDay = targetAccount?.closingDay || 15;
        if (singleTxDate.getDate() > closingDay) {
          singleTxDate.setMonth(singleTxDate.getMonth() + 1);
        }
      }

      if (!accountId) {
        console.error("[addTransaction] ERROR: accountId vacío, abortando insert", { amount, description, type });
        rollback();
        return;
      }

      const newTx: Omit<Transaction, "id"> = {
        amount, description: effDesc, category: effCategory, date: singleTxDate, type, accountId,
        currency: txCurrency,
        tags: effTags, note: extras?.note, receiptUrl: extras?.receiptUrl,
      };

      insertTransaction(newTx)
        .then((inserted) => setTransactions(prev => [inserted, ...prev]))
        .catch(err => {
          console.error("[addTransaction] Error Supabase:", err?.message || err, { accountId, amount, description });
          toast.error(`Error al guardar: ${err?.message || "Error desconocido"}`);
          rollback();
        });
    }
  }, [categories, accounts, rules]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    updateTransactionRemote(id, updates).catch(err => console.error(err));
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        if (updates.amount !== undefined && updates.amount !== t.amount) {
          const diff = updates.amount - t.amount;
          setAccounts(accs => accs.map(acc => {
            if (acc.id === updated.accountId) {
              // Para tarjetas de crédito: expense aumenta deuda (balance+), income reduce deuda
              const isCredit = acc.type === "credit";
              const newBal = isCredit
                ? (updated.type === "expense" ? acc.balance + diff : acc.balance - diff)
                : (updated.type === "income" ? acc.balance + diff : acc.balance - diff);
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
            // Para tarjetas de crédito: revertir un expense REDUCE la deuda (balance-)
            // Para cuentas normales: revertir un expense AUMENTA el saldo (balance+)
            const isCredit = acc.type === "credit";
            const newBal = isCredit
              ? (tx.type === "expense" ? acc.balance - tx.amount : acc.balance + tx.amount)
              : (tx.type === "income" ? acc.balance - tx.amount : acc.balance + tx.amount);
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
        // Para cuentas normales: revertir expense suma saldo (change positivo)
        // Para tarjetas de crédito: revertir expense REDUCE la deuda (change negativo)
        const deltas = new Map<string, number>();
        for (const tx of groupTxs) {
          const current = deltas.get(tx.accountId) || 0;
          // change se aplica con acc.balance + delta, así que:
          // crédito+expense → delta negativo (reduce deuda)
          // normal+expense → delta positivo (devuelve saldo)
          // El tipo de cuenta lo resolvemos al aplicar el delta:
          const change = tx.type === "income" ? -tx.amount : tx.amount;
          deltas.set(tx.accountId, current + change);
        }
        setAccounts(accs => accs.map(acc => {
          const delta = deltas.get(acc.id);
          if (delta !== undefined && delta !== 0) {
            // Para tarjetas de crédito: invertir el signo del delta
            // (revertir expense debe REDUCIR la deuda, no aumentarla)
            const creditAdjustedDelta = acc.type === "credit" ? -delta : delta;
            const newBal = acc.balance + creditAdjustedDelta;
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

  const seedDefaultCategories = useCallback(async () => {
    try {
      const seeded = await seedDefaultCategoriesRemote();
      setCategories(prev => [...prev, ...seeded]);
      toast.success("Categorías recomendadas cargadas correctamente");
    } catch (err) {
      console.error("Error seeding default categories:", err);
      toast.error("Error al cargar categorías recomendadas");
      throw err;
    }
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

      const sourceCurrency: Currency = (source.currency as Currency) || "ARS";
      const cardCurrency: Currency = (card.currency as Currency) || "ARS";

      // Si la cuenta fuente tiene moneda diferente a la tarjeta, convertir para reducir
      // la deuda correctamente en la moneda de la tarjeta.
      let amountInCardCurrency = amount;
      if (sourceCurrency !== cardCurrency) {
        const rateFrom = DEFAULT_EXCHANGE_RATES[sourceCurrency] ?? 1;
        const rateTo = DEFAULT_EXCHANGE_RATES[cardCurrency] ?? 1;
        const amountInArs = rateFrom > 0 ? amount / rateFrom : amount;
        amountInCardCurrency = amountInArs * rateTo;
      }

      const paymentCategory = { id: "card-payment", name: "Card Payment", color: "bg-sky-500", type: "expense" as const, icon: "credit-card" };
      const now = new Date();

      // Persistir ambas transacciones en Supabase
      const txsToInsert: Omit<Transaction, "id">[] = [
        {
          amount,
          description: `Pago tarjeta: ${card.name}`,
          category: paymentCategory,
          date: now,
          type: "expense",
          accountId: fromAccountId,
          currency: sourceCurrency,
          isCardPayment: true,
        },
        {
          amount: amountInCardCurrency,
          description: `Pago recibido desde ${source.name}`,
          category: { ...paymentCategory, type: "income" as const },
          date: now,
          type: "income",
          accountId: cardId,
          currency: cardCurrency,
          isCardPayment: true,
        },
      ];

      insertTransactionsBatch(txsToInsert)
        .then(() => fetchTransactions(categories).then(setTransactions))
        .catch(err => console.error("Error inserting card payment transactions:", err));

      // Actualizar balances:
      // - Cuenta fuente: pierde el monto pagado (en su moneda)
      // - Tarjeta: la deuda se REDUCE (balance - amountInCardCurrency)
      return prev.map(a => {
        if (a.id === fromAccountId) {
          const newBal = a.balance - amount;
          updateAccountRemote(a.id, { balance: newBal }).catch(console.error);
          return { ...a, balance: newBal };
        }
        if (a.id === cardId) {
          // Para crédito: balance positivo = deuda adeudada. Pagar reduce la deuda.
          const newBal = a.balance - amountInCardCurrency;
          updateAccountRemote(a.id, { balance: newBal }).catch(console.error);
          return { ...a, balance: newBal };
        }
        return a;
      });
    });
  }, [categories]);

  const transferBetweenAccounts = useCallback((fromAccountId: string, toAccountId: string, amount: number, targetAmount?: number) => {
    setAccounts(prev => {
      const from = prev.find(a => a.id === fromAccountId);
      const to = prev.find(a => a.id === toAccountId);
      if (!from || !to || amount <= 0) return prev;
      const creditAmount = (targetAmount !== undefined && targetAmount > 0) ? targetAmount : amount;
      const transferCategory: Category = { id: "transfer", name: "Transfer", color: "bg-sky-500", type: "expense", icon: "arrow-left-right" };
      const fromCurrency = (from.currency as Currency) || "ARS";
      const toCurrency = (to.currency as Currency) || "ARS";
      const now = new Date();

      const txsToInsert: Omit<Transaction, "id">[] = [
        {
          amount,
          description: `Transfer to ${to.name}`,
          category: { ...transferCategory, type: "expense" },
          date: now,
          type: "expense",
          accountId: fromAccountId,
          currency: fromCurrency,
          isTransfer: true,
        },
        {
          amount: creditAmount,
          description: `Transfer from ${from.name}`,
          category: { ...transferCategory, type: "income" },
          date: now,
          type: "income",
          accountId: toAccountId,
          currency: toCurrency,
          isTransfer: true,
        },
      ];

      insertTransactionsBatch(txsToInsert)
        .then(() => fetchTransactions(categories).then(setTransactions))
        .catch(err => console.error("Error inserting transfer transactions:", err));

      return prev.map(a => {
        if (a.id === fromAccountId) {
          const newBal = a.balance - amount;
          updateAccountRemote(a.id, { balance: newBal }).catch(console.error);
          return { ...a, balance: newBal };
        }
        if (a.id === toAccountId) {
          const newBal = a.balance + creditAmount;
          updateAccountRemote(a.id, { balance: newBal }).catch(console.error);
          return { ...a, balance: newBal };
        }
        return a;
      });
    });
  }, [categories]);

  const getStatementTransactions = useCallback((cardId: string, period: "current" | "previous" | number = "current") => {
    const card = accounts.find(a => a.id === cardId);
    if (!card || !card.closingDay) return [];
    const offset = typeof period === "number" ? period : (period === "previous" ? -1 : 0);
    const { periodStart, periodEnd } = getOffsetStatementPeriod(card.closingDay, offset);
    return transactions.filter(t =>
      t.accountId === cardId && t.type === "expense" && !t.isCardPayment && t.date >= periodStart && t.date <= periodEnd
    );
  }, [accounts, transactions]);

  const getActiveAccounts = useCallback(() => accounts.filter(a => !a.archived), [accounts]);
  const getArchivedAccounts = useCallback(() => accounts.filter(a => a.archived), [accounts]);
  const getCreditCards = useCallback(() => accounts.filter(a => a.type === "credit" && !a.archived), [accounts]);
  const getTransactionsByAccount = useCallback((accountId: string) => transactions.filter(t => t.accountId === accountId), [transactions]);
  const getNonCardAccounts = useCallback(() => accounts.filter(a => a.type !== "credit" && !a.archived), [accounts]);

  /**
   * Calcula el balance "real" de una cuenta sumando todas sus transacciones almacenadas,
   * con conversión de moneda correcta. Sirve para detectar y corregir inconsistencias.
   * Retorna null si la cuenta no existe.
   */
  const recalculateAccountBalance = useCallback((accountId: string): number | null => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return null;

    const accountCurrency = (account.currency as Currency) || "ARS";
    const accountTxs = transactions.filter(t => t.accountId === accountId);

    let computed = 0;
    for (const tx of accountTxs) {
      const txCur = (tx.currency as Currency) || accountCurrency;
      let amt = tx.amount;
      if (txCur !== accountCurrency) {
        const rateFrom = DEFAULT_EXCHANGE_RATES[txCur] ?? 1;
        const rateTo = DEFAULT_EXCHANGE_RATES[accountCurrency] ?? 1;
        amt = (rateFrom > 0 ? amt / rateFrom : amt) * rateTo;
      }
      if (account.type === "credit") {
        computed += tx.type === "expense" ? amt : -amt;
      } else {
        computed += tx.type === "income" ? amt : -amt;
      }
    }
    return computed;
  }, [accounts, transactions]);

  /**
   * Sincroniza el balance almacenado de UNA cuenta con el derivado de sus transacciones.
   * Útil para reparar inconsistencias históricas.
   */
  const syncAccountBalance = useCallback((accountId: string) => {
    const computed = recalculateAccountBalance(accountId);
    if (computed === null) return;
    setAccounts(prev => prev.map(a => {
      if (a.id === accountId) {
        updateAccountRemote(a.id, { balance: computed }).catch(console.error);
        return { ...a, balance: computed };
      }
      return a;
    }));
  }, [recalculateAccountBalance]);

  /**
   * Sincroniza el balance de TODAS las cuentas desde sus transacciones.
   */
  const syncAllAccountBalances = useCallback(() => {
    setAccounts(prev => prev.map(a => {
      const computed = recalculateAccountBalance(a.id);
      if (computed === null) return a;
      updateAccountRemote(a.id, { balance: computed }).catch(console.error);
      return { ...a, balance: computed };
    }));
  }, [recalculateAccountBalance]);

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
    let goalName = "Meta de Ahorro";
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      goalName = g.name;
      const next = g.currentAmount + amount;
      const completed = next >= g.targetAmount;
      updateGoalRemote(id, { currentAmount: next, completed }).catch(console.error);
      return { ...g, currentAmount: next, completed };
    }));

    if (accountId) {
      const goalCat = categories.find(c => c.id === "savings" || c.id === "investments") || {
        id: "savings",
        name: "Ahorro / Metas",
        color: "bg-emerald-500",
        type: "expense" as const,
        icon: "piggy-bank",
      };
      addTransaction(amount, `Aporte a meta: ${goalName}`, goalCat, "expense", accountId);
    }
  }, [categories, addTransaction]);

  const withdrawFromGoal = useCallback((id: string, amount: number, accountId?: string) => {
    let goalName = "Meta de Ahorro";
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      goalName = g.name;
      const next = Math.max(0, g.currentAmount - amount);
      const completed = next >= g.targetAmount;
      updateGoalRemote(id, { currentAmount: next, completed }).catch(console.error);
      return { ...g, currentAmount: next, completed };
    }));

    if (accountId) {
      const goalCat = categories.find(c => c.id === "savings" || c.id === "investments") || {
        id: "savings",
        name: "Ahorro / Metas",
        color: "bg-emerald-500",
        type: "income" as const,
        icon: "piggy-bank",
      };
      addTransaction(amount, `Retiro de meta: ${goalName}`, goalCat, "income", accountId);
    }
  }, [categories, addTransaction]);

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

    // Update bill: mark paid and advance due date (if recurring)
    const isOnce = bill.frequency === "once";
    const nextDue = isOnce ? new Date(bill.dueDate) : getNextDate(new Date(bill.dueDate), bill.frequency);
    updateBillRemote(id, { status: "paid", dueDate: nextDue }).catch(console.error);
    setBills(prev => prev.map(b => b.id === id ? { ...b, status: "paid" as const, dueDate: nextDue } : b));
  }, [bills, categories, addTransaction]);

  const getPendingBills = useCallback(() => {
    const now = new Date();
    // Solo mostrar bills NO pagadas (las pagadas van al historial, no a pendientes)
    return bills
      .filter(b => b.status !== "paid")
      .map(b => {
        const due = new Date(b.dueDate);
        const status = due < now ? "overdue" : "pending";
        return { ...b, status } as BillReminder;
      });
  }, [bills]);

  // ===== RECURRING TRANSACTIONS =====
  const addRecurringTx = useCallback((rtx: RecurringTransaction) => {
    insertRecurringTransaction(rtx)
      .then(inserted => setRecurringTxs(prev => [...prev, inserted]))
      .catch(err => {
        console.error("Error inserting recurring transaction:", err);
        toast.error("Error al guardar transacción recurrente");
      });
  }, []);

  const updateRecurringTx = useCallback((id: string, updates: Partial<RecurringTransaction>) => {
    updateRecurringTransactionRemote(id, updates).catch(err => console.error("Error updating recurring transaction:", err));
    setRecurringTxs(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRecurringTx = useCallback((id: string) => {
    deleteRecurringTransactionRemote(id).catch(err => console.error("Error deleting recurring transaction:", err));
    setRecurringTxs(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleRecurringPause = useCallback((id: string) => {
    setRecurringTxs(prev => {
      const target = prev.find(r => r.id === id);
      if (!target) return prev;
      const nextPaused = !target.paused;
      updateRecurringTransactionRemote(id, { paused: nextPaused }).catch(err => console.error(err));
      return prev.map(r => r.id === id ? { ...r, paused: nextPaused } : r);
    });
  }, []);

  const processRecurring = useCallback(() => {
    const now = new Date();
    setRecurringTxs(prev => {
      let anyUpdated = false;
      const nextList = prev.map(r => {
        if (r.paused) return r;
        let currentDate = new Date(r.nextDate);
        if (currentDate > now) return r;

        anyUpdated = true;
        if (r.frequency === "once") {
          addTransaction(r.amount, r.description, r.category, r.type, r.accountId, {
            tags: r.tags,
            currency: r.currency,
          });
          updateRecurringTransactionRemote(r.id, { paused: true }).catch(console.error);
          return { ...r, paused: true };
        }

        // Avanzar e insertar transacciones hasta que la próxima fecha supere el momento actual
        // Limitado a un máximo de 24 iteraciones de seguridad para evitar loops infinitos
        let iterations = 0;
        while (currentDate <= now && iterations < 24) {
          addTransaction(r.amount, r.description, r.category, r.type, r.accountId, {
            tags: r.tags,
            currency: r.currency,
          });
          currentDate = getNextDate(currentDate, r.frequency);
          iterations++;
        }

        updateRecurringTransactionRemote(r.id, { nextDate: currentDate }).catch(console.error);
        return { ...r, nextDate: currentDate };
      });

      return anyUpdated ? nextList : prev;
    });

    // Procesar vencimientos con débito automático (autoPay === true) que alcanzaron su fecha
    setBills(prevBills => {
      let anyBillUpdated = false;
      const nextBills = prevBills.map(bill => {
        if (!bill.autoPay || bill.status === "paid") return bill;
        const due = new Date(bill.dueDate);
        if (due > now) return bill;

        anyBillUpdated = true;
        const cat = categories.find(c => c.id === bill.categoryId) ||
          { id: "bills", name: "Servicios/Facturas", color: "bg-red-400", type: "expense" as const, icon: "file-text" };
        const targetAccId = bill.accountId || accounts[0]?.id;
        if (targetAccId) {
          addTransaction(bill.amount, bill.name, cat, "expense", targetAccId);
        }

        const isOnce = bill.frequency === "once";
        const nextDue = isOnce ? due : getNextDate(due, bill.frequency);
        updateBillRemote(bill.id, { status: "paid", dueDate: nextDue }).catch(console.error);
        return { ...bill, status: "paid" as const, dueDate: nextDue };
      });

      return anyBillUpdated ? nextBills : prevBills;
    });
  }, [addTransaction, categories, accounts]);

  // ===== TAGS =====
  const addTag = useCallback((tag: Tag) => {
    insertTag(tag)
      .then(inserted => {
        setTags(prev => {
          const updated = [...prev.filter(t => t.id !== tag.id), inserted];
          saveJSON("tags", updated);
          return updated;
        });
      })
      .catch(err => {
        console.error("Error inserting remote tag:", err);
        // Fallback local
        setTags(prev => {
          const updated = [...prev, tag];
          saveJSON("tags", updated);
          return updated;
        });
      });
  }, []);

  const updateTag = useCallback((id: string, updates: Partial<Tag>) => {
    updateTagRemote(id, updates).catch(err => console.error("Error updating remote tag:", err));
    setTags(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveJSON("tags", updated);
      return updated;
    });
  }, []);

  const deleteTag = useCallback((id: string) => {
    deleteTagRemote(id).catch(err => console.error("Error deleting remote tag:", err));
    setTags(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveJSON("tags", updated);
      return updated;
    });
  }, []);

  const getTransactionCountByTag = useCallback((tagId: string) => {
    return transactions.filter(t => t.tags?.includes(tagId)).length;
  }, [transactions]);

  // ===== COMPUTED =====
  const totalBalance = accounts.filter(a => !a.archived).reduce((sum, acc) => sum + acc.balance, 0);

  // Usar new Date() en cada evaluación para que los valores reflejen el día real
  // aunque la app quede abierta sobre la medianoche o cambio de mes
  const _now = new Date();

  const monthlyExpenses = transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === _now.getMonth() && t.date.getFullYear() === _now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncome = transactions
    .filter(t => t.type === "income" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === _now.getMonth() && t.date.getFullYear() === _now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);

  const todaySpent = transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && t.date.toDateString() === _now.toDateString())
    .reduce((sum, t) => sum + t.amount, 0);

  const weekSpent = (() => {
    const weekStart = new Date(_now);
    weekStart.setDate(_now.getDate() - _now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return transactions
      .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date >= weekStart)
      .reduce((sum, t) => sum + t.amount, 0);
  })();

  // Monthly data for last 6 months
  const getMonthlyTrend = useCallback(() => {
    const today = new Date();
    const months: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
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
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const m = lastMonth.getMonth();
    const y = lastMonth.getFullYear();
    return transactions
      .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === m && t.date.getFullYear() === y)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // ===== RULES ENGINE (P10) =====
  const addRule = useCallback((rule: TransactionRule) => {
    insertRule(rule)
      .then(inserted => {
        setRules(prev => {
          const updated = [...prev.filter(r => r.id !== rule.id), inserted];
          saveJSON(RULES_STORAGE_KEY, updated);
          return updated;
        });
      })
      .catch(err => {
        console.error("Error inserting remote rule:", err);
        setRules(prev => {
          const updated = [...prev, rule];
          saveJSON(RULES_STORAGE_KEY, updated);
          return updated;
        });
      });
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<TransactionRule>) => {
    updateRuleRemote(id, updates).catch(err => console.error("Error updating remote rule:", err));
    setRules(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveJSON(RULES_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const deleteRule = useCallback((id: string) => {
    deleteRuleRemote(id).catch(err => console.error("Error deleting remote rule:", err));
    setRules(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveJSON(RULES_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => {
      const target = prev.find(r => r.id === id);
      const nextActive = target ? !target.isActive : true;
      updateRuleRemote(id, { isActive: nextActive }).catch(err => console.error("Error toggling remote rule:", err));
      const updated = prev.map(r => r.id === id ? { ...r, isActive: nextActive } : r);
      saveJSON(RULES_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

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
    addCategory, updateCategory, archiveCategory, unarchiveCategory, deleteCategory, reassignTransactions, seedDefaultCategories,
    getTransactionCountByCategory, getRootCategories, getSubcategories, getArchivedCategories, getAllActiveCategories,
    addAccount, updateAccount, archiveAccount, unarchiveAccount, adjustAccountBalance,
    recalculateAccountBalance, syncAccountBalance, syncAllAccountBalances,
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
