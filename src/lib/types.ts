export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
};

export type Transaction = {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: Date;
  type: TransactionType;
  accountId: string;
};

export type Account = {
  id: string;
  name: string;
  balance: number;
  type: "checking" | "savings" | "credit" | "cash";
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: "groceries", name: "Groceries", color: "bg-emerald-500", type: "expense" },
  { id: "transport", name: "Transport", color: "bg-sky-500", type: "expense" },
  { id: "dining", name: "Dining", color: "bg-orange-500", type: "expense" },
  { id: "bills", name: "Bills", color: "bg-red-400", type: "expense" },
  { id: "health", name: "Health", color: "bg-pink-500", type: "expense" },
  { id: "shopping", name: "Shopping", color: "bg-violet-500", type: "expense" },
  { id: "entertainment", name: "Entertainment", color: "bg-amber-500", type: "expense" },
  { id: "other-expense", name: "Other", color: "bg-zinc-500", type: "expense" },
  { id: "salary", name: "Salary", color: "bg-emerald-400", type: "income" },
  { id: "freelance", name: "Freelance", color: "bg-teal-400", type: "income" },
  { id: "investments", name: "Investments", color: "bg-cyan-400", type: "income" },
  { id: "other-income", name: "Other", color: "bg-zinc-400", type: "income" },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: "checking", name: "Checking", balance: 4280.50, type: "checking", color: "bg-sky-500" },
  { id: "savings", name: "Savings", balance: 12750.00, type: "savings", color: "bg-emerald-500" },
  { id: "credit", name: "Credit Card", balance: -1420.30, type: "credit", color: "bg-red-400" },
  { id: "cash", name: "Cash", balance: 340.00, type: "cash", color: "bg-amber-500" },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: "1", amount: 84.20, description: "Whole Foods", category: CATEGORIES[0], date: new Date(2026, 2, 18, 12, 40), type: "expense", accountId: "checking" },
  { id: "2", amount: 12.50, description: "Uber", category: CATEGORIES[1], date: new Date(2026, 2, 18, 9, 15), type: "expense", accountId: "checking" },
  { id: "3", amount: 45.00, description: "Dinner at Nobu", category: CATEGORIES[2], date: new Date(2026, 2, 17, 20, 30), type: "expense", accountId: "credit" },
  { id: "4", amount: 5200.00, description: "March Salary", category: CATEGORIES[8], date: new Date(2026, 2, 15, 8, 0), type: "income", accountId: "checking" },
  { id: "5", amount: 120.00, description: "Electric Bill", category: CATEGORIES[3], date: new Date(2026, 2, 14, 10, 0), type: "expense", accountId: "checking" },
  { id: "6", amount: 35.90, description: "Pharmacy", category: CATEGORIES[4], date: new Date(2026, 2, 14, 14, 20), type: "expense", accountId: "checking" },
  { id: "7", amount: 250.00, description: "Freelance Project", category: CATEGORIES[9], date: new Date(2026, 2, 13, 16, 0), type: "income", accountId: "checking" },
  { id: "8", amount: 62.40, description: "Amazon", category: CATEGORIES[5], date: new Date(2026, 2, 13, 11, 30), type: "expense", accountId: "credit" },
  { id: "9", amount: 28.00, description: "Netflix + Spotify", category: CATEGORIES[6], date: new Date(2026, 2, 12, 0, 0), type: "expense", accountId: "credit" },
  { id: "10", amount: 15.00, description: "Coffee & Snacks", category: CATEGORIES[2], date: new Date(2026, 2, 18, 8, 0), type: "expense", accountId: "cash" },
];
