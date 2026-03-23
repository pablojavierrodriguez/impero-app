import { createContext, useContext, useState, useCallback } from "react";

export type Currency = "ARS" | "USD" | "EUR";
export type Language = "es" | "en";
export type ChartType = "bar" | "area" | "none";

export type HomeSection = {
  id: string;
  label: string;
  enabled: boolean;
};

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: "velocity", label: "Barra de gasto diario", enabled: true },
  { id: "balance", label: "Balance general", enabled: true },
  { id: "accounts", label: "Tarjetas de cuentas", enabled: true },
  { id: "breakdown", label: "Desglose de gastos", enabled: true },
  { id: "recent", label: "Últimas transacciones", enabled: true },
];

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "ARS", label: "Peso argentino", symbol: "$" },
  { value: "USD", label: "Dólar estadounidense", symbol: "US$" },
  { value: "EUR", label: "Euro", symbol: "€" },
];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

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

export function useSettingsStore() {
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

  const currencySymbol = CURRENCIES.find(c => c.value === settings.currency)?.symbol ?? "$";

  return { settings, updateSettings, toggleHomeSection, resetSettings, currencySymbol };
}
