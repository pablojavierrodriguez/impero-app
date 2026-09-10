import { useState } from "react";
import { ChevronRight, RotateCcw, DollarSign, Languages, BarChart3, LayoutGrid, Hash, Eye, Sun, Moon, Monitor, Smartphone, Shield, EyeOff, Palette, Check, LayoutList, Calculator, SlidersHorizontal, User, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WhatsAppIntegrationModal } from "@/components/WhatsAppIntegrationModal";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { DashboardCardPicker } from "@/components/DashboardCardPicker";
import { useSettings, CURRENCIES, DEFAULT_EXCHANGE_RATES, type Currency, type ChartType, type ThemeMode, type AppTheme } from "@/lib/settings-store";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useAuth } from "@/lib/auth-context";
import type { Language } from "@/lib/i18n";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

const THEMES: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

const APP_THEMES: {
  value: AppTheme;
  label: string;
  subtitle: string;
  color: string;
  ringColor: string;
  styleTrait: string;
  pillShape: string;
}[] = [
  {
    value: "mobills",
    label: "Royal Violet",
    subtitle: "Curvas orgánicas & Violeta neón fluido",
    color: "bg-[#8B5CF6]",
    ringColor: "ring-[#8B5CF6]",
    styleTrait: "Orgánico",
    pillShape: "rounded-full",
  },
  {
    value: "m3",
    label: "Obsidian Emerald",
    subtitle: "OLED puro & Minimalismo esmeralda sobrio",
    color: "bg-[#10b981]",
    ringColor: "ring-[#10b981]",
    styleTrait: "Minimalista",
    pillShape: "rounded-[10px]",
  },
  {
    value: "wallet",
    label: "Cobalt Flow",
    subtitle: "Azul marino suizo & Precisión arquitectónica",
    color: "bg-[#3B82F6]",
    ringColor: "ring-[#3B82F6]",
    styleTrait: "Estructurado",
    pillShape: "rounded-[6px]",
  },
];

interface SettingsPageProps {
  onImportCsv: () => void;
}

function SettingRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-5 pb-2">
      {children}
    </h3>
  );
}

export function SettingsPage({ onImportCsv }: SettingsPageProps) {
  const { settings, updateSettings, toggleHomeSection, resetSettings, currencySymbol, t } = useSettings();
  const { isPrivacyMode, setPrivacyMode } = usePrivacy();
  const { user, signOut } = useAuth();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="pt-4 pb-28 md:pb-8">
      <div className="px-4 pb-3">
        <h1 className="text-[20px] font-display font-semibold text-foreground">{t("settings.title")}</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
      </div>

      <div className="px-4 mb-4">
        <PwaInstallPrompt />
      </div>

      <div className="card-surface mx-4">
        <div className="card-inner space-y-0 divide-y divide-border/50">
          <SectionTitle>{t("settings.general")}</SectionTitle>

          <SettingRow icon={DollarSign} label={t("settings.currency")}>
            <Select value={settings.currency} onValueChange={(v) => updateSettings({ currency: v as Currency })}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">
                    {c.symbol} {t(`currency.${c.value}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Languages} label={t("settings.language")}>
            <Select value={settings.language} onValueChange={(v) => updateSettings({ language: v as Language })}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value} className="text-xs">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Eye} label={t("settings.showDecimals")}>
            <Switch checked={settings.showDecimals} onCheckedChange={(v) => updateSettings({ showDecimals: v })} />
          </SettingRow>

          {/* Tipos de cambio de referencia */}
          <div className="py-3 px-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Cotizaciones de Referencia (en ARS)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded-xl bg-background border border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono-data">1 USD =</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={Math.round(1 / ((settings.customExchangeRates?.USD) || DEFAULT_EXCHANGE_RATES.USD))}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1200;
                      updateSettings({
                        customExchangeRates: {
                          ...DEFAULT_EXCHANGE_RATES,
                          ...(settings.customExchangeRates || {}),
                          USD: 1 / val,
                        },
                      });
                    }}
                    className="w-16 h-7 text-xs text-right bg-secondary/50 rounded px-1 text-foreground font-mono-data focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="p-2 rounded-xl bg-background border border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono-data">1 EUR =</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={Math.round(1 / ((settings.customExchangeRates?.EUR) || DEFAULT_EXCHANGE_RATES.EUR))}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1300;
                      updateSettings({
                        customExchangeRates: {
                          ...DEFAULT_EXCHANGE_RATES,
                          ...(settings.customExchangeRates || {}),
                          EUR: 1 / val,
                        },
                      });
                    }}
                    className="w-16 h-7 text-xs text-right bg-secondary/50 rounded px-1 text-foreground font-mono-data focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          <SectionTitle>{t("settings.display")}</SectionTitle>

          {/* Visual App Style Theme Selector */}
          <div className="py-3 px-4 border-b border-border/40">
            <div className="flex items-center gap-3 mb-2.5">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium text-foreground block">Estilo visual y sensorial</span>
                <span className="text-[11px] text-muted-foreground">Adapta curvas, sombras, relieves y paleta cromática</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1.5">
              {APP_THEMES.map(theme => {
                const isSelected = (settings.appTheme || "m3") === theme.value;
                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => updateSettings({ appTheme: theme.value })}
                    className={`flex flex-col justify-between p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40"
                        : "bg-secondary/40 border-border/50 hover:bg-secondary/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${theme.color} shrink-0 ring-2 ${isSelected ? theme.ringColor : "ring-transparent"}`} />
                        <span className="text-xs font-semibold text-foreground">{theme.label}</span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">
                          {theme.styleTrait}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-muted-foreground block mb-2 leading-tight">
                      {theme.subtitle}
                    </span>

                    {/* Mini-mockup visual de forma y curvatura */}
                    <div className="w-full pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/80">Estilo {theme.styleTrait}</span>
                      <div className={`h-3 w-12 ${theme.pillShape} border border-border/80 bg-background flex items-center justify-center`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-3">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{t("settings.darkMode")}</span>
            </div>
            <div className="flex bg-secondary rounded-full p-0.5">
              {THEMES.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => updateSettings({ theme: theme.value })}
                  className={`p-1.5 rounded-full transition-colors ${
                    settings.theme === theme.value ? "bg-card text-foreground" : "text-muted-foreground"
                  }`}
                  title={theme.label}
                >
                  <theme.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          <SettingRow icon={BarChart3} label={t("settings.chartType")}>
            <Select value={settings.chartType} onValueChange={(v) => updateSettings({ chartType: v as ChartType })}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="donut" className="text-xs">{t("settings.chartDonut")}</SelectItem>
                <SelectItem value="bar" className="text-xs">{t("settings.chartBar")}</SelectItem>
                <SelectItem value="area" className="text-xs">{t("settings.chartArea")}</SelectItem>
                <SelectItem value="none" className="text-xs">{t("settings.chartNone")}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={LayoutList} label="Disposición de Cuentas">
            <Select
              value={settings.accountViewMode || "list"}
              onValueChange={(v) => updateSettings({ accountViewMode: v as "list" | "carousel" })}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list" className="text-xs">Lista ordenada</SelectItem>
                <SelectItem value="carousel" className="text-xs">Carrusel compacto</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Calculator} label="Subtotales diarios en historial">
            <Switch
              checked={settings.showDailySubtotals ?? false}
              onCheckedChange={(v) => updateSettings({ showDailySubtotals: v })}
            />
          </SettingRow>

          <SettingRow icon={Hash} label={t("settings.dailyBudget")}>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{currencySymbol}</span>
              <input type="number" value={settings.dailyBudget}
                onChange={(e) => updateSettings({ dailyBudget: Number(e.target.value) || 0 })}
                className="w-20 h-8 text-xs text-right bg-background border border-border/50 rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </SettingRow>

          <SectionTitle>{t("settings.homeSections")}</SectionTitle>

          {/* Launcher interactivo del Dashboard Card Picker */}
          <div className="p-4 bg-secondary/20 rounded-2xl mx-4 my-2 border border-border/40">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-foreground block font-display truncate">
                    {t("settings.customizeHome") || "Personalizar Inicio"}
                  </span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap block">
                    {settings.homeSections.filter(s => s.enabled).length} de {settings.homeSections.length} widgets activos
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <span>Editar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              {t("settings.customizeHomeSubtitle") || "Elegí y organizá qué widgets, gráficos y datos ver en la pantalla principal."}
            </p>

            {/* Mini pills de widgets activos (máximo 4 + indicador de restantes) */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {settings.homeSections
                .filter(s => s.enabled)
                .slice(0, 4)
                .map(section => (
                  <span
                    key={section.id}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 border border-border/50 text-muted-foreground flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate max-w-[120px]">{t(section.labelKey)}</span>
                  </span>
                ))}
              {settings.homeSections.filter(s => s.enabled).length > 4 && (
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium hover:bg-primary/20 transition-colors"
                >
                  +{settings.homeSections.filter(s => s.enabled).length - 4} más
                </button>
              )}
            </div>
          </div>

          <DashboardCardPicker
            open={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
          />

          <SectionTitle>Integraciones & Automatización</SectionTitle>
          <WhatsAppIntegrationModal />

          <SectionTitle>Privacidad & Seguridad</SectionTitle>
          <div className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-3">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm text-foreground">Modo Privacidad</span>
                <span className="text-[11px] text-muted-foreground">Oculta saldos y montos en pantalla (Atajo: tecla H)</span>
              </div>
            </div>
            <Switch checked={isPrivacyMode} onCheckedChange={setPrivacyMode} />
          </div>

          <SectionTitle>{t("settings.data")}</SectionTitle>

          <button onClick={onImportCsv}
            className="flex items-center justify-between w-full py-3 px-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{t("settings.importCsv")}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button onClick={() => {
            localStorage.removeItem("onboarding-complete");
            resetSettings();
          }}
            className="flex items-center justify-between w-full py-3 px-4 hover:bg-destructive/10 transition-colors">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{t("settings.reset")}</span>
            </div>
          </button>

          {user && (
            <>
              <SectionTitle>Cuenta & Sesión</SectionTitle>
              <div className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-foreground truncate">{user.email}</span>
                    <span className="text-[11px] text-muted-foreground">Sesión iniciada</span>
                  </div>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center justify-between w-full py-3 px-4 hover:bg-destructive/10 transition-colors text-destructive"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">Cerrar sesión</span>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive/50" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
