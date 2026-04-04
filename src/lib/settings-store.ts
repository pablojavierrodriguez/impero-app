import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { createTranslator, type TranslationKey, type Language } from "./i18n";
import React from "react";

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

const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
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

const DEFAULT_SETTINGS: AppSettings = {
  currency: "ARS",
  language: "es",
  chartType: "bar",
  homeSections: DEFAULT_HOME_SECTIONS,
  dailyBudget: 150,
  showDecimals: true,
};

export type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleHomeSection: (sectionId: string) => void;
  resetSettings: () => void;
  currencySymbol: string;
  convertAmount: (arsAmount: number) => number;
  formatAmount: (arsAmount: number, opts?: { sign?: string; abs?: boolean }) => string;
  t: (key: TranslationKey) => string;
  isSectionEnabled: (id: string) => boolean;
  exchangeRates: Record<Currency, number>;
  updateExchangeRate: (currency: Currency, rate: number) => void;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("app-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with new default sections
        const savedSections = parsed.homeSections || [];
        const mergedSections = DEFAULT_HOME_SECTIONS.map(def => {
          const existing = savedSections.find((s: HomeSection) => s.id === def.id);
          return existing || def;
        });
        return { ...DEFAULT_SETTINGS, ...parsed, homeSections: mergedSections };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("app-settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleHomeSection = useCallback((sectionId: string) => {
    setSettings(prev => {
      const next = {
        ...prev,
        homeSections: prev.homeSections.map(s =>
          s.id === sectionId ? { ...s, enabled: !s.enabled } : s
        ),
      };
      localStorage.setItem("app-settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem("app-settings");
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const updateExchangeRate = useCallback((currency: Currency, rate: number) => {
    setSettings(prev => {
      const rates = { ...(prev.customExchangeRates || DEFAULT_EXCHANGE_RATES), [currency]: rate };
      const next = { ...prev, customExchangeRates: rates };
      localStorage.setItem("app-settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextType>(() => {
    const sym = CURRENCIES.find(c => c.value === settings.currency)?.symbol ?? "$";
    const rates = settings.customExchangeRates || DEFAULT_EXCHANGE_RATES;
    const rate = rates[settings.currency] ?? 1;
    const t = createTranslator(settings.language);

    const convertAmount = (ars: number) => ars * rate;

    const formatAmount = (ars: number, opts?: { sign?: string; abs?: boolean }) => {
      const converted = Math.abs(ars) * rate;
      const formatted = converted.toLocaleString("en-US", {
        minimumFractionDigits: settings.showDecimals ? 2 : 0,
        maximumFractionDigits: settings.showDecimals ? 2 : 0,
      });
      const sign = opts?.sign ?? "";
      return `${sign}${sym}${formatted}`;
    };

    const isSectionEnabled = (id: string) =>
      settings.homeSections.find(s => s.id === id)?.enabled ?? true;

    return {
      settings, updateSettings, toggleHomeSection, resetSettings,
      currencySymbol: sym, convertAmount, formatAmount, t, isSectionEnabled,
      exchangeRates: rates, updateExchangeRate,
    };
  }, [settings, updateSettings, toggleHomeSection, resetSettings, updateExchangeRate]);

  return React.createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function useSettingsStore() {
  return useSettings();
}
