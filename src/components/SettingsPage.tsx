import { ChevronRight, RotateCcw, DollarSign, Languages, BarChart3, LayoutGrid, Hash, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AppSettings,
  CURRENCIES,
  LANGUAGES,
  Currency,
  Language,
  ChartType,
  HomeSection,
} from "@/lib/settings-store";

interface SettingsPageProps {
  settings: AppSettings;
  currencySymbol: string;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onToggleHomeSection: (id: string) => void;
  onReset: () => void;
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

export function SettingsPage({ settings, currencySymbol, onUpdate, onToggleHomeSection, onReset, onImportCsv }: SettingsPageProps) {
  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3">
        <h1 className="text-[20px] font-display font-semibold text-foreground">Configuración</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">Personalizá tu experiencia</p>
      </div>

      <div className="card-surface mx-4">
        <div className="card-inner space-y-0 divide-y divide-border/50">
          <SectionTitle>General</SectionTitle>

          <SettingRow icon={DollarSign} label="Moneda">
            <Select
              value={settings.currency}
              onValueChange={(v) => onUpdate({ currency: v as Currency })}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">
                    {c.symbol} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Languages} label="Idioma">
            <Select
              value={settings.language}
              onValueChange={(v) => onUpdate({ language: v as Language })}
            >
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

          <SettingRow icon={Eye} label="Mostrar decimales">
            <Switch
              checked={settings.showDecimals}
              onCheckedChange={(v) => onUpdate({ showDecimals: v })}
            />
          </SettingRow>

          <SectionTitle>Visualización</SectionTitle>

          <SettingRow icon={BarChart3} label="Tipo de gráfico">
            <Select
              value={settings.chartType}
              onValueChange={(v) => onUpdate({ chartType: v as ChartType })}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar" className="text-xs">Barras</SelectItem>
                <SelectItem value="area" className="text-xs">Área</SelectItem>
                <SelectItem value="none" className="text-xs">Sin gráfico</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Hash} label="Presupuesto diario">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{currencySymbol}</span>
              <input
                type="number"
                value={settings.dailyBudget}
                onChange={(e) => onUpdate({ dailyBudget: Number(e.target.value) || 0 })}
                className="w-20 h-8 text-xs text-right bg-background border border-border/50 rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </SettingRow>

          <SectionTitle>Secciones del Home</SectionTitle>

          {settings.homeSections.map(section => (
            <div key={section.id} className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{section.label}</span>
              </div>
              <Switch
                checked={section.enabled}
                onCheckedChange={() => onToggleHomeSection(section.id)}
              />
            </div>
          ))}

          <SectionTitle>Datos</SectionTitle>

          <button
            onClick={onImportCsv}
            className="flex items-center justify-between w-full py-3 px-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Importar CSV</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-between w-full py-3 px-4 hover:bg-destructive/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">Restablecer configuración</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
