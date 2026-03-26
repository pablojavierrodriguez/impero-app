import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { createTranslator, type TranslationKey, type Language } from "./i18n";
import React from "react";

export type { Language };
export type Currency = "ARS" | "USD" | "EUR";
export type ChartType = "bar" | "area" | "none";

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
  { id: "recent", labelKey: "settings.sectionRecent", enabled: true },
];

export const CURRENCIES: { value: Currency; symbol: string }[] = [
  { value: "ARS", symbol: "$" },
  { value: "USD", symbol: "US$" },
  { value: "EUR", symbol: "€" },
];

// Exchange rates relative to ARS (base currency for stored amounts)
// ARS → target. All internal amounts are stored in ARS.
const EXCHANGE_RATES: Record<Currency, number> = {
  ARS: 1,
  USD: 1 / 1200, // 1 ARS = ~0.00083 USD
  EUR: 1 / 1300, // 1 ARS = ~0.00077 EUR
};

export type AppSettings = {
  currency: Currency;
  language: Language;
  chartType: ChartType;
  homeSections: HomeSection[];
  dailyBudget: number;
  showDecimals: boolean;
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
  /** Convert an amount from ARS (storage currency) to display currency */
  convertAmount: (arsAmount: number) => number;
  /** Format a number in the display currency with symbol */
  formatAmount: (arsAmount: number, opts?: { sign?: string; abs?: boolean }) => string;
  /** Translation function */
  t: (key: TranslationKey) => string;
  /** Is a home section enabled? */
  isSectionEnabled: (id: string) => boolean;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("app-settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
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

  const value = useMemo<SettingsContextType>(() => {
    const sym = CURRENCIES.find(c => c.value === settings.currency)?.symbol ?? "$";
    const rate = EXCHANGE_RATES[settings.currency];
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
      settings,
      updateSettings,
      toggleHomeSection,
      resetSettings,
      currencySymbol: sym,
      convertAmount,
      formatAmount,
      t,
      isSectionEnabled,
    };
  }, [settings, updateSettings, toggleHomeSection, resetSettings]);

  return React.createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

// Keep backward compat export
export function useSettingsStore() {
  return useSettings();
}
