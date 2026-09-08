import { TranslationKey, type Language } from "./i18n";

export type { Language };
export type Currency = "ARS" | "USD" | "EUR";
export type ChartType = "donut" | "bar" | "area" | "none";
export type ThemeMode = "dark" | "light" | "system";
export type AppTheme = "m3" | "mobills" | "wallet";

export type CardCategory = "finances" | "analytics" | "planning" | "operations";
export type CardColumn = "left" | "right" | "full";

export type HomeSection = {
  id: string;
  labelKey: TranslationKey;
  descriptionKey?: string;
  category: CardCategory;
  column: CardColumn;
  enabled: boolean;
  order: number;
};

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: "velocity", labelKey: "settings.sectionVelocity", category: "finances", column: "left", enabled: true, order: 0 },
  { id: "balance", labelKey: "settings.sectionBalance", category: "finances", column: "left", enabled: true, order: 1 },
  { id: "accounts", labelKey: "settings.sectionAccounts", category: "finances", column: "left", enabled: true, order: 2 },
  { id: "net_worth", labelKey: "settings.sectionNetWorth", category: "analytics", column: "left", enabled: true, order: 3 },
  { id: "breakdown", labelKey: "settings.sectionBreakdown", category: "analytics", column: "left", enabled: true, order: 4 },
  { id: "monthly_comparison", labelKey: "settings.sectionMonthlyComparison", category: "analytics", column: "right", enabled: true, order: 5 },
  { id: "budgets", labelKey: "settings.sectionBudgets", category: "planning", column: "right", enabled: true, order: 6 },
  { id: "goals", labelKey: "settings.sectionGoals", category: "planning", column: "right", enabled: true, order: 7 },
  { id: "bills", labelKey: "settings.sectionBills", category: "operations", column: "right", enabled: true, order: 8 },
  { id: "health_score", labelKey: "settings.sectionHealthScore", category: "analytics", column: "right", enabled: true, order: 9 },
  { id: "recent", labelKey: "settings.sectionRecent", category: "operations", column: "right", enabled: true, order: 10 },
];

export const CURRENCIES: { value: Currency; symbol: string }[] = [
  { value: "ARS", symbol: "$" },
  { value: "USD", symbol: "US$" },
  { value: "EUR", symbol: "€" },
];

export const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  ARS: 1,
  USD: 1 / 1200,
  EUR: 1 / 1300,
};

export type AppSettings = {
  currency: Currency;
  language: Language;
  chartType: ChartType;
  homeSections: HomeSection[];
  dailyBudget: number;
  showDecimals: boolean;
  customExchangeRates?: Record<Currency, number>;
  theme: ThemeMode;
  appTheme?: AppTheme;
  accountViewMode?: "list" | "carousel";
  showDailySubtotals?: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  currency: "ARS",
  language: "es",
  chartType: "donut",
  homeSections: DEFAULT_HOME_SECTIONS,
  dailyBudget: 150,
  showDecimals: true,
  theme: "dark",
  appTheme: "m3",
  accountViewMode: "list",
  showDailySubtotals: false,
};

