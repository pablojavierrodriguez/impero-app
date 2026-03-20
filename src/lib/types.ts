export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
  icon?: string; // lucide icon name
  parentId?: string | null; // null = root category
  archived?: boolean;
  order?: number;
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

export type AccountType = "checking" | "savings" | "credit" | "cash";

export type Account = {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  color: string;
  icon?: string;
  archived?: boolean;
};

export const ACCOUNT_ICONS = [
  "wallet", "credit-card", "piggy-bank", "banknote", "landmark",
  "building-2", "coins", "hand-coins", "receipt", "briefcase",
  "safe", "circle-dollar-sign", "bitcoin", "gem",
];

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit Card" },
  { value: "cash", label: "Cash" },
];

export const CATEGORIES: Category[] = [
  { id: "groceries", name: "Groceries", color: "bg-emerald-500", type: "expense", icon: "shopping-cart", parentId: null },
  { id: "transport", name: "Transport", color: "bg-sky-500", type: "expense", icon: "car", parentId: null },
  { id: "dining", name: "Dining", color: "bg-orange-500", type: "expense", icon: "utensils", parentId: null },
  { id: "bills", name: "Bills", color: "bg-red-400", type: "expense", icon: "file-text", parentId: null },
  { id: "health", name: "Health", color: "bg-pink-500", type: "expense", icon: "heart-pulse", parentId: null },
  { id: "shopping", name: "Shopping", color: "bg-violet-500", type: "expense", icon: "shopping-bag", parentId: null },
  { id: "entertainment", name: "Entertainment", color: "bg-amber-500", type: "expense", icon: "tv", parentId: null },
  { id: "other-expense", name: "Other", color: "bg-zinc-500", type: "expense", icon: "circle-dot", parentId: null },
  { id: "salary", name: "Salary", color: "bg-emerald-400", type: "income", icon: "banknote", parentId: null },
  { id: "freelance", name: "Freelance", color: "bg-teal-400", type: "income", icon: "laptop", parentId: null },
  { id: "investments", name: "Investments", color: "bg-cyan-400", type: "income", icon: "trending-up", parentId: null },
  { id: "other-income", name: "Other", color: "bg-zinc-400", type: "income", icon: "circle-dot", parentId: null },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: "checking", name: "Checking", balance: 4280.50, type: "checking", color: "bg-sky-500", icon: "landmark" },
  { id: "savings", name: "Savings", balance: 12750.00, type: "savings", color: "bg-emerald-500", icon: "piggy-bank" },
  { id: "credit", name: "Credit Card", balance: -1420.30, type: "credit", color: "bg-red-400", icon: "credit-card" },
  { id: "cash", name: "Cash", balance: 340.00, type: "cash", color: "bg-amber-500", icon: "wallet" },
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

export const CATEGORY_COLORS = [
  "bg-emerald-500", "bg-sky-500", "bg-orange-500", "bg-red-400",
  "bg-pink-500", "bg-violet-500", "bg-amber-500", "bg-zinc-500",
  "bg-emerald-400", "bg-teal-400", "bg-cyan-400", "bg-rose-500",
  "bg-indigo-500", "bg-lime-500", "bg-fuchsia-500", "bg-yellow-500",
];

export const CATEGORY_ICONS = [
  "shopping-cart", "car", "utensils", "file-text", "heart-pulse",
  "shopping-bag", "tv", "circle-dot", "banknote", "laptop",
  "trending-up", "home", "plane", "gift", "book", "music",
  "coffee", "dumbbell", "baby", "dog", "scissors", "wrench",
  "graduation-cap", "briefcase", "palette", "gamepad-2", "shirt",
  "fuel", "pill", "stethoscope",
];
