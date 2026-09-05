import { supabase } from "@/integrations/supabase/client";
import { AppSettings, Currency, ChartType, ThemeMode, HomeSection, DEFAULT_SETTINGS, DEFAULT_HOME_SECTIONS } from "@/lib/settings-types";
import type { Language } from "@/lib/i18n";

/**
 * Obtiene la configuración guardada en la base de datos de Supabase para el usuario autenticado
 */
export async function fetchRemoteSettings(): Promise<AppSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user settings from Supabase:", error);
    return null;
  }

  if (!data) return null;

  // Reconciliar secciones de home para asegurar que contengan todas las secciones válidas
  const savedSections = (Array.isArray(data.home_sections) ? data.home_sections : []) as HomeSection[];
  const mergedSections = DEFAULT_HOME_SECTIONS.map(def => {
    const existing = savedSections.find(s => s.id === def.id);
    return existing || def;
  });

  return {
    currency: (data.currency as Currency) || DEFAULT_SETTINGS.currency,
    language: (data.language as Language) || DEFAULT_SETTINGS.language,
    chartType: (data.chart_type as ChartType) || DEFAULT_SETTINGS.chartType,
    dailyBudget: Number(data.daily_budget) || DEFAULT_SETTINGS.dailyBudget,
    showDecimals: typeof data.show_decimals === "boolean" ? data.show_decimals : DEFAULT_SETTINGS.showDecimals,
    theme: (data.theme as ThemeMode) || DEFAULT_SETTINGS.theme,
    homeSections: mergedSections,
    customExchangeRates: (data.custom_exchange_rates as Record<Currency, number>) || undefined,
  };
}

/**
 * Guarda o actualiza la configuración del usuario autenticado en la base de datos de Supabase
 */
export async function saveRemoteSettings(settings: AppSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        currency: settings.currency,
        language: settings.language,
        chart_type: settings.chartType,
        daily_budget: settings.dailyBudget,
        show_decimals: settings.showDecimals,
        theme: settings.theme,
        home_sections: settings.homeSections as any,
        custom_exchange_rates: settings.customExchangeRates as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Error saving user settings to Supabase:", error);
    throw error;
  }
}
