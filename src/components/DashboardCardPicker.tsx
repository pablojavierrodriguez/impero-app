import { useState, useMemo } from "react";
import { motion, Reorder } from "framer-motion";
import {
  GripVertical, RotateCcw, SlidersHorizontal, Search, BarChart3, PieChart,
  Wallet, Zap, Target, Bell, Shield, TrendingUp, Clock,
  PiggyBank, LayoutGrid, ChevronUp, ChevronDown, Sparkles
} from "lucide-react";
import { useSettings, type HomeSection, type CardCategory } from "@/lib/settings-store";
import { ResponsiveSheet } from "@/components/ResponsiveSheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DashboardCardPickerProps {
  open: boolean;
  onClose: () => void;
}

interface CardMeta {
  id: string;
  icon: React.ElementType;
  badgeColor: string;
  previewType: "velocity" | "balance" | "accounts" | "net_worth" | "breakdown" | "monthly_comparison" | "budgets" | "goals" | "bills" | "health_score" | "recent";
  descriptionEs: string;
  descriptionEn: string;
}

const CARD_METAS: Record<string, CardMeta> = {
  velocity: {
    id: "velocity",
    icon: Zap,
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    previewType: "velocity",
    descriptionEs: "Barra de consumo y ritmo del presupuesto diario en tiempo real",
    descriptionEn: "Daily budget spending speed and real-time pace progress bar",
  },
  balance: {
    id: "balance",
    icon: Wallet,
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    previewType: "balance",
    descriptionEs: "Saldo total consolidado multimoneda con selector y desglose de mes",
    descriptionEn: "Consolidated multi-currency total balance with monthly breakdown",
  },
  accounts: {
    id: "accounts",
    icon: LayoutGrid,
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    previewType: "accounts",
    descriptionEs: "Cuentas bancarias, billeteras virtuales y tarjetas de crédito",
    descriptionEn: "Bank accounts, crypto/wallets and credit cards",
  },
  net_worth: {
    id: "net_worth",
    icon: TrendingUp,
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    previewType: "net_worth",
    descriptionEs: "Curva histórica de patrimonio neto a 30 o 90 días con variación neta",
    descriptionEn: "Historical net worth progression curve (30D/90D) with delta",
  },
  breakdown: {
    id: "breakdown",
    icon: PieChart,
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    previewType: "breakdown",
    descriptionEs: "Gráfico de torta/dona interactivo y ranking de gastos por categoría",
    descriptionEn: "Interactive donut/pie chart and category spending distribution",
  },
  monthly_comparison: {
    id: "monthly_comparison",
    icon: Sparkles,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    previewType: "monthly_comparison",
    descriptionEs: "Comparativa de gasto contra el mes anterior con delta porcentual",
    descriptionEn: "Spending comparison vs previous month with percentage delta",
  },
  budgets: {
    id: "budgets",
    icon: PiggyBank,
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    previewType: "budgets",
    descriptionEs: "Resumen de presupuestos activos con barras de consumo mensual",
    descriptionEn: "Active budget summaries with monthly consumption progress bars",
  },
  goals: {
    id: "goals",
    icon: Target,
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    previewType: "goals",
    descriptionEs: "Metas de ahorro en curso con porcentaje de cumplimiento hacia el objetivo",
    descriptionEn: "Ongoing savings goals progress tracking towards your target",
  },
  bills: {
    id: "bills",
    icon: Bell,
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    previewType: "bills",
    descriptionEs: "Próximos vencimientos de servicios, suscripciones y tarjetas",
    descriptionEn: "Upcoming due dates for services, subscriptions and card statements",
  },
  health_score: {
    id: "health_score",
    icon: Shield,
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    previewType: "health_score",
    descriptionEs: "Score integral de salud financiera (0-100) según ahorro y deudas",
    descriptionEn: "Comprehensive financial health score (0-100) based on savings and debts",
  },
  recent: {
    id: "recent",
    icon: Clock,
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    previewType: "recent",
    descriptionEs: "Últimas 5 transacciones registradas con acceso a edición rápida",
    descriptionEn: "Last 5 recorded transactions with quick edit and swipe gestures",
  },
};

/** Mini ilustración vectorial elegante para previsualizar el widget */
function WidgetPreviewGraphic({
  type,
  t,
}: {
  type: CardMeta["previewType"];
  t: (key: any) => string;
}) {
  switch (type) {
    case "velocity":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 p-2 flex flex-col justify-center gap-1">
          <div className="flex justify-between items-center text-[8px] text-muted-foreground">
            <span>{t("picker.preview.spentToday")}</span>
            <span className="font-mono-data">$4.500 / $15.000</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="w-1/3 h-full bg-primary rounded-full" />
          </div>
        </div>
      );
    case "balance":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 px-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[7px] text-muted-foreground">{t("picker.preview.totalBalance")}</span>
            <span className="text-[11px] font-mono-data font-bold text-foreground">$1.840.500</span>
          </div>
          <div className="flex gap-1">
            <span className="text-[8px] px-1 py-0.5 rounded bg-primary/20 text-primary font-mono">ARS</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-secondary text-muted-foreground font-mono">USD</span>
          </div>
        </div>
      );
    case "net_worth":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 p-1.5 flex items-end justify-between gap-1 overflow-hidden relative">
          <svg className="w-full h-full text-cyan-400/30" viewBox="0 0 100 25" preserveAspectRatio="none">
            <path d="M0,20 Q20,18 40,12 T80,8 T100,2 L100,25 L0,25 Z" fill="currentColor" />
            <path d="M0,20 Q20,18 40,12 T80,8 T100,2" fill="none" stroke="#22d3ee" strokeWidth="2" />
          </svg>
          <span className="absolute top-1 right-2 text-[8px] font-mono text-cyan-400 font-semibold">+8.4%</span>
        </div>
      );
    case "monthly_comparison":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Sparkles className="w-2.5 h-2.5 text-primary" />
            <span>{t("picker.preview.vsLastMonth")}</span>
          </div>
          <span className="text-[9px] font-mono-data font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">
            -12%
          </span>
        </div>
      );
    case "breakdown":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 p-1 flex items-center justify-between px-3">
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="0" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-30" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-55" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-75" />
            </svg>
            <div className="absolute w-2.5 h-2.5 rounded-full bg-card" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[8px] text-muted-foreground">{t("picker.preview.distribution")}</span>
            <span className="text-[10px] font-mono-data font-semibold text-foreground">{t("picker.preview.topExpenses")}</span>
          </div>
        </div>
      );
    case "budgets":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 p-1.5 flex flex-col justify-center gap-1">
          <div className="flex justify-between text-[8px] text-muted-foreground">
            <span>{t("picker.preview.grocery")}</span>
            <span className="font-mono-data text-emerald-400">62%</span>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div className="w-[62%] h-full bg-emerald-500 rounded-full" />
          </div>
        </div>
      );
    case "goals":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 p-1.5 flex flex-col justify-center gap-1">
          <div className="flex justify-between text-[8px] text-muted-foreground">
            <span>{t("picker.preview.emergencyFund")}</span>
            <span className="font-mono-data text-teal-400">85%</span>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-teal-500 rounded-full" />
          </div>
        </div>
      );
    case "bills":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[9px] text-foreground truncate">{t("picker.preview.utilities")}</span>
          </div>
          <span className="text-[8px] font-mono text-muted-foreground">{t("picker.preview.in3d")}</span>
        </div>
      );
    case "health_score":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 px-2 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">{t("picker.preview.financialHealth")}</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-primary font-mono">82</span>
            <span className="text-[9px]">💪</span>
          </div>
        </div>
      );
    case "accounts":
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 px-2 flex items-center gap-1.5">
          <div className="w-5 h-4 rounded bg-primary/20 border border-primary/30" />
          <div className="w-5 h-4 rounded bg-blue-500/20 border border-blue-500/30" />
          <div className="w-5 h-4 rounded bg-secondary border border-border" />
          <span className="text-[8px] text-muted-foreground font-mono ml-auto">{t("picker.preview.accountsCount")}</span>
        </div>
      );
    case "recent":
    default:
      return (
        <div className="w-full h-8 rounded-lg bg-secondary/40 border border-border/30 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[9px] text-foreground truncate">{t("picker.preview.coffeeSnacks")}</span>
          </div>
          <span className="text-[8px] font-mono text-muted-foreground">-$3.200</span>
        </div>
      );
  }
}

export function DashboardCardPicker({ open, onClose }: DashboardCardPickerProps) {
  const {
    settings,
    reorderHomeSections,
    toggleHomeSection,
    resetHomeSections,
    t,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<"organize" | "catalog">("organize");
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const sections = settings.homeSections || [];
  const enabledCount = useMemo(() => sections.filter(s => s.enabled).length, [sections]);

  // Lista para Reorder (reorganizar la secuencia visual)
  const handleReorder = (newOrderedList: HomeSection[]) => {
    reorderHomeSections(newOrderedList);
  };

  // Movimiento accesible hacia arriba o abajo
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    reorderHomeSections(updated);
  };

  // Filtrado de catálogo
  const filteredCatalog = useMemo(() => {
    return sections.filter(section => {
      const meta = CARD_METAS[section.id];
      const matchesCat = selectedCategory === "all" || section.category === selectedCategory;
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const label = t(section.labelKey).toLowerCase();
      const desc = settings.language === "es" ? meta?.descriptionEs : meta?.descriptionEn;
      return label.includes(q) || (desc && desc.toLowerCase().includes(q));
    });
  }, [sections, selectedCategory, searchQuery, t, settings.language]);

  const categories: { id: CardCategory | "all"; label: string }[] = [
    { id: "all", label: t("picker.catAll") || "Todas" },
    { id: "finances", label: t("picker.catFinances") || "Finanzas" },
    { id: "analytics", label: t("picker.catAnalytics") || "Análisis" },
    { id: "planning", label: t("picker.catPlanning") || "Planificación" },
    { id: "operations", label: t("picker.catOperations") || "Operaciones" },
  ];

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span>{t("picker.title") || "Personalizar Dashboard"}</span>
        </div>
      }
      titleRight={
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all active:scale-95"
        >
          {t("picker.done") || "Listo"}
        </button>
      }
    >
      <div className="px-5 pb-6 space-y-4">
        {/* Subtítulo descriptivo y contador de widgets activos */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
          <span>{t("picker.subtitle") || "Organizá tus widgets, gráficos y métricas favoritas"}</span>
          <span className="font-mono px-2 py-0.5 rounded-full bg-secondary/80 text-foreground font-semibold">
            {enabledCount}/{sections.length} {t("picker.activeCount") || "activas"}
          </span>
        </div>

        {/* Tab switcher: Organizar vs Explorar Catálogo */}
        <div className="flex rounded-xl bg-secondary/50 p-1 border border-border/30">
          <button
            type="button"
            onClick={() => setActiveTab("organize")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === "organize"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GripVertical className="w-3.5 h-3.5 text-primary" />
            {t("picker.tabOrganize") || "Organizar"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === "catalog"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
            {t("picker.tabExplore") || "Catálogo"}
          </button>
        </div>

        {/* ======================= PESTAÑA: ORGANIZAR ======================= */}
        {activeTab === "organize" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>{t("picker.dragHint") || "Arrastrá para reordenar la posición en pantalla"}</span>
              <button
                type="button"
                onClick={resetHomeSections}
                className="flex items-center gap-1 text-primary hover:underline transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                {t("picker.resetDefault") || "Restablecer sugerido"}
              </button>
            </div>

            <Reorder.Group
              axis="y"
              values={sections}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {sections.map((section, index) => {
                const meta = CARD_METAS[section.id];
                const IconComponent = meta?.icon || LayoutGrid;

                return (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all select-none relative bg-card/80 backdrop-blur-sm",
                      section.enabled
                        ? "border-border/60 hover:border-primary/50 shadow-xs"
                        : "border-border/30 opacity-50 bg-secondary/20"
                    )}
                    whileDrag={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                      borderColor: "hsl(var(--primary))",
                      zIndex: 50,
                    }}
                  >
                    {/* Drag Handle & Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground/60 hover:text-foreground transition-colors"
                        title="Arrastrar para mover"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div className={cn("w-7 h-7 rounded-xl border flex items-center justify-center shrink-0", meta?.badgeColor)}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-semibold text-foreground truncate font-display">
                          {t(section.labelKey)}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {settings.language === "es" ? meta?.descriptionEs : meta?.descriptionEn}
                        </span>
                      </div>
                    </div>

                    {/* Quick controls: Flechas de mover arriba/abajo + Switch de visibilidad */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex flex-col gap-0.5 mr-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          aria-label={t("picker.moveUp") || "Subir"}
                          className="w-5 h-5 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-20 transition-all"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={index === sections.length - 1}
                          aria-label={t("picker.moveDown") || "Bajar"}
                          className="w-5 h-5 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-20 transition-all"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      <Switch
                        checked={section.enabled}
                        onCheckedChange={() => toggleHomeSection(section.id)}
                        aria-label={t(section.labelKey)}
                      />
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        )}

        {/* ======================= PESTAÑA: CATÁLOGO ======================= */}
        {activeTab === "catalog" && (
          <div className="space-y-3.5">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("picker.search") || "Buscar tarjetas o widgets..."}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-secondary/40 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Categorías (Pills) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 border",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid de Cards con mini-previews visuales */}
            {filteredCatalog.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                {t("picker.noResults") || "No se encontraron widgets para esta búsqueda"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredCatalog.map(section => {
                  const meta = CARD_METAS[section.id];
                  const IconComponent = meta?.icon || LayoutGrid;

                  return (
                    <div
                      key={section.id}
                      className={cn(
                        "p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all relative overflow-hidden",
                        section.enabled
                          ? "bg-card/90 border-border/70 shadow-xs"
                          : "bg-secondary/20 border-border/30 opacity-75"
                      )}
                    >
                      {/* Cabecera de la card del catálogo */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0", meta?.badgeColor)}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-foreground block truncate font-display">
                              {t(section.labelKey)}
                            </span>
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {section.category}
                            </span>
                          </div>
                        </div>

                        <Switch
                          checked={section.enabled}
                          onCheckedChange={() => toggleHomeSection(section.id)}
                        />
                      </div>

                      {/* Mini preview gráfica del contenido del widget */}
                      <div className="w-full">
                        {meta && <WidgetPreviewGraphic type={meta.previewType} t={t} />}
                      </div>

                      {/* Descripción y badge de layout */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                        <span className="text-muted-foreground/80 line-clamp-1 flex-1 pr-2">
                          {settings.language === "es" ? meta?.descriptionEs : meta?.descriptionEn}
                        </span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground font-mono text-[9px]">
                          {section.column === "left" ? (t("picker.sizeFull") || "Col 1") : (t("picker.sizeCompact") || "Col 2")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ResponsiveSheet>
  );
}
