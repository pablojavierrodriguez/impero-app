import { ChevronRight, RotateCcw, DollarSign, Languages, BarChart3, LayoutGrid, Hash, Eye, Sun, Moon, Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, CURRENCIES, type Currency, type ChartType, type ThemeMode } from "@/lib/settings-store";
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

  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3">
        <h1 className="text-[20px] font-display font-semibold text-foreground">{t("settings.title")}</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
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

          <SectionTitle>{t("settings.display")}</SectionTitle>

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
                <SelectItem value="bar" className="text-xs">{t("settings.chartBar")}</SelectItem>
                <SelectItem value="area" className="text-xs">{t("settings.chartArea")}</SelectItem>
                <SelectItem value="none" className="text-xs">{t("settings.chartNone")}</SelectItem>
              </SelectContent>
            </Select>
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

          {settings.homeSections.map(section => (
            <div key={section.id} className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{t(section.labelKey)}</span>
              </div>
              <Switch checked={section.enabled} onCheckedChange={() => toggleHomeSection(section.id)} />
            </div>
          ))}

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
        </div>
      </div>
    </div>
  );
}
