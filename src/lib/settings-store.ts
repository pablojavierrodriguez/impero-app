import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { createTranslator, type TranslationKey, type Language } from "./i18n";
import { useAuth } from "./auth-context";
import { fetchRemoteSettings, saveRemoteSettings } from "@/services/settings.service";
import React from "react";

export * from "./settings-types";
import {
  Currency,
  ChartType,
  ThemeMode,
  HomeSection,
  AppSettings,
  DEFAULT_HOME_SECTIONS,
  CURRENCIES,
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_SETTINGS,
} from "./settings-types";

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
  const { user } = useAuth();
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

  const isInitialSyncRef = useRef(true);

  // Sincronizar desde Supabase al autenticarse el usuario
  useEffect(() => {
    if (!user) {
      isInitialSyncRef.current = true;
      return;
    }

    let isMounted = true;
    fetchRemoteSettings()
      .then(remoteSettings => {
        if (!isMounted || !remoteSettings) return;
        setSettings(remoteSettings);
        localStorage.setItem("app-settings", JSON.stringify(remoteSettings));
      })
      .catch(err => {
        console.error("Error loading settings from Supabase:", err);
      })
      .finally(() => {
        if (isMounted) {
          isInitialSyncRef.current = false;
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const persistSettings = useCallback((next: AppSettings) => {
    localStorage.setItem("app-settings", JSON.stringify(next));
    if (user) {
      saveRemoteSettings(next).catch(err => {
        console.error("Error persisting settings to Supabase:", err);
      });
    }
  }, [user]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const toggleHomeSection = useCallback((sectionId: string) => {
    setSettings(prev => {
      const next = {
        ...prev,
        homeSections: prev.homeSections.map(s =>
          s.id === sectionId ? { ...s, enabled: !s.enabled } : s
        ),
      };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const resetSettings = useCallback(() => {
    localStorage.removeItem("app-settings");
    setSettings(DEFAULT_SETTINGS);
    if (user) {
      saveRemoteSettings(DEFAULT_SETTINGS).catch(err => {
        console.error("Error resetting settings in Supabase:", err);
      });
    }
  }, [user]);

  const updateExchangeRate = useCallback((currency: Currency, rate: number) => {
    setSettings(prev => {
      const rates = { ...(prev.customExchangeRates || DEFAULT_EXCHANGE_RATES), [currency]: rate };
      const next = { ...prev, customExchangeRates: rates };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

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
