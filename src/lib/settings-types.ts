import { TranslationKey, type Language } from "./i18n";

export type { Language };
export type Currency = "ARS" | "USD" | "EUR";
export type ChartType = "bar" | "area" | "none";
export type ThemeMode = "dark" | "light" | "system";

export type HomeSection = {
  id: string;
  labelKey: TranslationKey;
  enabled: boolean;
};

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: "velocity", labelKey: "settings.sectionVelocity", enabled: true },
  { id: "balance", labelKey: "settings.sectionBalance", enabled: true },
  { id: "accounts", labelKey: "settings.sectionAccounts", enabled: true },
  { id: "breakdown", labelKey: "settings.sectionBreakdown", enabled: true },
  { id: "budgets", labelKey: "settings.sectionBudgets", enabled: true },
  { id: "goals", labelKey: "settings.sectionGoals", enabled: true },
  { id: "bills", labelKey: "settings.sectionBills", enabled: true },
  { id: "recent", labelKey: "settings.sectionRecent", enabled: true },
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
};

export const DEFAULT_SETTINGS: AppSettings = {
  currency: "ARS",
  language: "es",
  chartType: "bar",
  homeSections: DEFAULT_HOME_SECTIONS,
  dailyBudget: 150,
  showDecimals: true,
  theme: "dark",
};
