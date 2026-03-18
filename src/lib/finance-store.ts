import { useState, useCallback } from "react";
import { Transaction, Account, DEFAULT_ACCOUNTS, SAMPLE_TRANSACTIONS, Category } from "./types";

export function useFinanceStore() {
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);

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
    // Update account balances based on imported transactions
    setAccounts(prev =>
      prev.map(acc => {
        const delta = txs
          .filter(t => t.accountId === acc.id)
          .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
        return delta !== 0 ? { ...acc, balance: acc.balance + delta } : acc;
      })
    );
  }, []);

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
    addTransaction,
    totalBalance,
    monthlyExpenses,
    monthlyIncome,
    dailyBudget,
    todaySpent,
  };
}
