import type { Currency } from "./settings-types";
export type { Currency };

export type TransactionType = "income" | "expense";

export type CreditCardBrand = "visa" | "mastercard" | "amex" | "naranja-x" | "custom";

export const CARD_BRANDS: { value: CreditCardBrand; label: string; icon: string }[] = [
  { value: "visa", label: "Visa", icon: "credit-card" },
  { value: "mastercard", label: "Mastercard", icon: "credit-card" },
  { value: "amex", label: "American Express", icon: "credit-card" },
  { value: "naranja-x", label: "Naranja X", icon: "credit-card" },
  { value: "custom", label: "Other", icon: "credit-card" },
];

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
  isCardPayment?: boolean;
  isTransfer?: boolean;
  tags?: string[];
  note?: string;
  receiptUrl?: string;
  recurringId?: string;
  installmentInfo?: { current: number; total: number; groupId: string };
  currency?: Currency;
};

export type Budget = {
  id: string;
  categoryId: string;
  amount: number; // monthly limit in ARS
  month: number; // 0-11
  year: number;
  enableRollover?: boolean;
  accumulatedRollover?: number;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  icon: string;
  completed: boolean;
  createdAt: Date;
};

export type RecurrenceFrequency = "once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

export type RecurringTransaction = {
  id: string;
  amount: number;
  description: string;
  category: Category;
  type: TransactionType;
  accountId: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  nextDate: Date;
  paused: boolean;
  tags?: string[];
  currency?: Currency;
};

export type BillReminder = {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  frequency: RecurrenceFrequency;
  categoryId?: string;
  accountId?: string;
  status: "pending" | "paid" | "overdue";
  autoPay: boolean;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
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
  // Credit card specific
  creditLimit?: number;
  closingDay?: number; // 1-28
  paymentDay?: number; // 1-28
  brand?: CreditCardBrand;
  customBrandName?: string;
  currency?: Currency; // 'ARS' | 'USD' | 'EUR', defaults to 'ARS'
  creditCardViewMode?: "statement_cycles" | "negative_balance"; // Ciclos de facturación vs saldo continuo de pasivo
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
  { id: "credit", name: "Visa Gold", balance: -1420.30, type: "credit", color: "bg-red-400", icon: "credit-card", creditLimit: 5000, closingDay: 15, paymentDay: 5, brand: "visa" },
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

// Statement period helpers
export function getStatementPeriod(closingDay: number, referenceDate: Date = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (day <= closingDay) {
    // We're before/on closing day - active statement started last month
    periodStart = new Date(year, month - 1, closingDay + 1, 0, 0, 0, 0);
    periodEnd = new Date(year, month, closingDay, 23, 59, 59, 999);
  } else {
    // We're after closing day - active statement started this month
    periodStart = new Date(year, month, closingDay + 1, 0, 0, 0, 0);
    periodEnd = new Date(year, month + 1, closingDay, 23, 59, 59, 999);
  }

  return { periodStart, periodEnd };
}

export function getOffsetStatementPeriod(closingDay: number, offset: number, referenceDate: Date = new Date()) {
  let period = getStatementPeriod(closingDay, referenceDate);
  if (offset === 0) return period;

  if (offset > 0) {
    for (let i = 0; i < offset; i++) {
      const nextRef = new Date(period.periodEnd);
      nextRef.setDate(nextRef.getDate() + 2);
      period = getStatementPeriod(closingDay, nextRef);
    }
  } else {
    for (let i = 0; i < Math.abs(offset); i++) {
      const prevRef = new Date(period.periodStart);
      prevRef.setDate(prevRef.getDate() - 1);
      period = getStatementPeriod(closingDay, prevRef);
    }
  }

  return period;
}

export function getPreviousStatementPeriod(closingDay: number, referenceDate: Date = new Date()) {
  return getOffsetStatementPeriod(closingDay, -1, referenceDate);
}

export function getPaymentDueDate(closingDay: number, paymentDay: number, referenceDate: Date = new Date()) {
  const { periodEnd } = getStatementPeriod(closingDay, referenceDate);
  // Payment is due on paymentDay of the month after the statement closes
  const dueDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, paymentDay);
  return dueDate;
}

// Shopping List types
export type ShoppingListStatus = "active" | "completed" | "archived";

export type ShoppingListItem = {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isChecked: boolean;
  sortOrder: number;
};

export type ShoppingList = {
  id: string;
  name: string;
  status: ShoppingListStatus;
  targetAccountId?: string | null;
  targetCategoryId?: string | null;
  items: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
};

export type {
  TransactionRule,
  RuleCondition,
  RuleActions,
  RuleField,
  RuleOperator,
} from "./rules-engine";
