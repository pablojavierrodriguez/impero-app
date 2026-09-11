import { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ArrowLeft, Layers, PieChart as PieIcon } from "lucide-react";
import { Transaction, Category } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";

const COLOR_HEX_MAP: Record<string, string> = {
  "bg-emerald-500": "#10b981",
  "bg-sky-500": "#0ea5e9",
  "bg-orange-500": "#f97316",
  "bg-red-400": "#f87171",
  "bg-pink-500": "#ec4899",
  "bg-violet-500": "#8b5cf6",
  "bg-amber-500": "#f59e0b",
  "bg-zinc-500": "#71717a",
  "bg-emerald-400": "#34d399",
  "bg-teal-400": "#2dd4bf",
  "bg-cyan-400": "#22d3ee",
  "bg-rose-500": "#f43f5e",
  "bg-indigo-500": "#6366f1",
  "bg-lime-500": "#84cc16",
  "bg-fuchsia-500": "#d946ef",
  "bg-yellow-500": "#eab308",
  "bg-zinc-400": "#a1a1aa",
};

function getHexColor(twClass?: string, fallbackIndex = 0): string {
  if (twClass && COLOR_HEX_MAP[twClass]) return COLOR_HEX_MAP[twClass];
  const palette = Object.values(COLOR_HEX_MAP);
  return palette[fallbackIndex % palette.length];
}

interface SubcategoryData {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon?: string;
  percentageOfParent: number;
  percentageOfTotal: number;
}

interface ParentCategoryData {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon?: string;
  percentageOfTotal: number;
  subcategories: SubcategoryData[];
}

interface CategoryExpensePieCardProps {
  transactions: Transaction[];
  categories?: Category[];
  title?: string;
  hideHeader?: boolean;
  className?: string;
}

export function CategoryExpensePieCard({
  transactions,
  categories = [],
  title,
  hideHeader = false,
  className = "",
}: CategoryExpensePieCardProps) {
  const { formatAmount, t } = useSettings();

  // Estado para categoría en modo drill-down (null = vista general de todas las categorías)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  // Estado para la porción activa (hover o tap) en el gráfico de torta
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Categorías expandidas en la lista (acordeón inline)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const triggerHaptic = (duration = 10) => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(duration);
      }
    } catch {}
  };

  // Mapeo rápido de categorías por ID para ubicar padres de subcategorías
  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categories]);

  // Procesamiento jerárquico de gastos por categoría y subcategoría
  const { parentCategories, totalExpenses } = useMemo(() => {
    const expenses = transactions.filter(
      (tx) => tx.type === "expense" && !tx.isCardPayment && !tx.isTransfer
    );

    const total = expenses.reduce((sum, tx) => sum + tx.amount, 0);

    // Agrupación padre -> subcategorías
    const parentMap = new Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        icon?: string;
        amount: number;
        subMap: Map<string, { id: string; name: string; amount: number; color: string; icon?: string }>;
      }
    >();

    expenses.forEach((tx) => {
      const cat = tx.category;
      // Ver si la categoría tiene parentId definido en el objeto o en el catálogo global
      const catInCatalog = categoriesMap.get(cat.id);
      const parentId = cat.parentId || catInCatalog?.parentId;

      let rootId = cat.id;
      let rootName = cat.name;
      let rootColor = cat.color;
      let rootIcon = cat.icon;
      let isSub = false;

      if (parentId) {
        const parent = categoriesMap.get(parentId);
        if (parent) {
          rootId = parent.id;
          rootName = parent.name;
          rootColor = parent.color;
          rootIcon = parent.icon;
          isSub = true;
        }
      }

      if (!parentMap.has(rootId)) {
        parentMap.set(rootId, {
          id: rootId,
          name: rootName,
          color: rootColor,
          icon: rootIcon,
          amount: 0,
          subMap: new Map(),
        });
      }

      const parentEntry = parentMap.get(rootId)!;
      parentEntry.amount += tx.amount;

      if (isSub) {
        // La transacción fue directamente a la subcategoría
        const existingSub = parentEntry.subMap.get(cat.id) || {
          id: cat.id,
          name: cat.name,
          amount: 0,
          color: cat.color || rootColor,
          icon: cat.icon,
        };
        existingSub.amount += tx.amount;
        parentEntry.subMap.set(cat.id, existingSub);
      } else {
        // Transacción directa a la categoría padre sin subcategoría específica
        const uncategorizedSubId = `${rootId}__direct`;
        const existingSub = parentEntry.subMap.get(uncategorizedSubId) || {
          id: uncategorizedSubId,
          name: t("category.general") || "General",
          amount: 0,
          color: rootColor,
          icon: rootIcon,
        };
        existingSub.amount += tx.amount;
        parentEntry.subMap.set(uncategorizedSubId, existingSub);
      }
    });

    const parents: ParentCategoryData[] = Array.from(parentMap.values())
      .map((p) => {
        const pTotal = p.amount;
        const subcategories: SubcategoryData[] = Array.from(p.subMap.values())
          .map((s) => ({
            id: s.id,
            name: s.name,
            amount: s.amount,
            color: s.color,
            icon: s.icon,
            percentageOfParent: pTotal > 0 ? (s.amount / pTotal) * 100 : 0,
            percentageOfTotal: total > 0 ? (s.amount / total) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount);

        return {
          id: p.id,
          name: p.name,
          amount: p.amount,
          color: p.color,
          icon: p.icon,
          percentageOfTotal: total > 0 ? (p.amount / total) * 100 : 0,
          subcategories,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { parentCategories: parents, totalExpenses: total };
  }, [transactions, categoriesMap, t]);

  // Categoría seleccionada actualmente para drill-down
  const activeParent = useMemo(() => {
    if (!selectedParentId) return null;
    return parentCategories.find((p) => p.id === selectedParentId) || null;
  }, [parentCategories, selectedParentId]);

  // Si la categoría seleccionada para drill-down no existe en el nuevo período, volver a vista general
  if (selectedParentId && !activeParent) {
    setSelectedParentId(null);
  }

  // Datos para el PieChart según estemos en nivel general o drill-down
  const currentPieData = useMemo(() => {
    if (activeParent) {
      // Nivel subcategorías de la categoría padre activa
      return activeParent.subcategories.map((sub, idx) => ({
        id: sub.id,
        name: sub.name,
        value: sub.amount,
        colorHex: getHexColor(sub.color, idx),
        colorClass: sub.color,
        icon: sub.icon || activeParent.icon,
        percentage: sub.percentageOfParent,
      }));
    }

    // Nivel global (categorías raíz)
    return parentCategories.map((p, idx) => ({
      id: p.id,
      name: p.name,
      value: p.amount,
      colorHex: getHexColor(p.color, idx),
      colorClass: p.color,
      icon: p.icon,
      percentage: p.percentageOfTotal,
    }));
  }, [activeParent, parentCategories]);

  const toggleExpand = (catId: string) => {
    triggerHaptic(6);
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleDrillDown = (parentId: string) => {
    triggerHaptic(12);
    setSelectedParentId(parentId);
    setActiveIndex(null);
  };

  const handleGoBack = () => {
    triggerHaptic(10);
    setSelectedParentId(null);
    setActiveIndex(null);
  };

  const currentTotalAmount = activeParent ? activeParent.amount : totalExpenses;
  const activeItem = activeIndex !== null ? currentPieData[activeIndex] : null;

  return (
    <div className={`p-4 rounded-[16px] bg-card border border-border/50 shadow-sm ${className || "mx-4 mb-4"}`}>
      {/* Header del Card */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {activeParent ? (
              <button
                onClick={handleGoBack}
                className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary active:scale-95 transition-all flex items-center gap-1 text-[12px] font-medium"
                title={t("category.backToAll")}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("common.back")}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-primary" />
                <h3 className="text-[13px] font-medium text-foreground">
                  {title || t("report.topCategories")}
                </h3>
              </div>
            )}
          </div>

          {activeParent && (
            <div className="flex items-center gap-1.5 bg-secondary/80 px-2.5 py-1 rounded-full text-[11px] font-medium text-foreground">
              <div className={`w-2.5 h-2.5 rounded-full ${activeParent.color}`} />
              <span className="truncate max-w-[120px]">{activeParent.name}</span>
            </div>
          )}
        </div>
      )}

      {currentPieData.length === 0 ? (
        <p className="text-[13px] text-muted-foreground py-6 text-center">
          {t("common.noData") || "No hay gastos en este período"}
        </p>
      ) : (
        <div>
          {/* Donut Chart interactivo con Centro Informativo */}
          <div className="relative h-48 mb-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={76}
                  paddingAngle={2.5}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(_, index) => {
                    if (!activeParent) {
                      handleDrillDown(currentPieData[index].id);
                    } else {
                      setActiveIndex(index);
                    }
                  }}
                  cursor="pointer"
                  animationDuration={600}
                >
                  {currentPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}-${index}`}
                      fill={entry.colorHex}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                      className="transition-opacity duration-200"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centro dinámico del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <AnimatePresence mode="wait">
                {activeItem ? (
                  <motion.div
                    key={`active-${activeItem.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center max-w-[110px]"
                  >
                    <span className="text-[10px] text-muted-foreground font-medium truncate w-full uppercase tracking-wider">
                      {activeItem.name}
                    </span>
                    <span className="text-[15px] font-bold font-mono-data text-foreground leading-tight">
                      {activeItem.percentage.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono-data truncate w-full">
                      {formatAmount(activeItem.value)}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="total-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center max-w-[110px]"
                  >
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {activeParent ? (t("pie.totalCategory") || "Total Categoría") : (t("pie.totalExpenses") || "Total Gastos")}
                    </span>
                    <span className="text-[14px] font-bold font-mono-data text-foreground leading-tight mt-0.5">
                      {formatAmount(currentTotalAmount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                      {currentPieData.length} {currentPieData.length === 1 ? (t("pie.item") || "rubro") : (t("pie.items") || "rubros")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Hint de navegación rápida si estamos en nivel raíz */}
          {!activeParent && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2 px-1">
              <span>{t("pie.category") || "Categoría"}</span>
              <span>{t("pie.totalPct") || "% Total / Monto"}</span>
            </div>
          )}

          {/* LISTA DE DESGLOSE */}
          <div className="space-y-2">
            {activeParent ? (
              /* Desglose de subcategorías de la categoría activa */
              <div className="space-y-2.5">
                {activeParent.subcategories.map((sub, idx) => {
                  const isHovered = activeIndex === idx;
                  return (
                    <div
                      key={sub.id}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                      className={`p-2 rounded-xl transition-all ${
                        isHovered ? "bg-secondary/60" : "bg-secondary/20 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[13px] mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5 h-5 rounded-lg ${sub.color} flex items-center justify-center shrink-0`}>
                            <CategoryIcon name={sub.icon || activeParent.icon || "circle-dot"} className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-foreground font-medium text-[13px] truncate">{sub.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right shrink-0">
                          <span className="text-[11px] font-semibold text-primary font-mono-data bg-primary/10 px-1.5 py-0.5 rounded">
                            {sub.percentageOfParent.toFixed(1)}%
                          </span>
                          <span className="font-mono-data text-foreground font-medium text-[13px]">
                            {formatAmount(sub.amount)}
                          </span>
                        </div>
                      </div>
                      {/* Barra de progreso visual */}
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sub.color} transition-all duration-300`}
                          style={{ width: `${Math.min(100, Math.max(0, sub.percentageOfParent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Vista de categorías raíz con posibilidad de acordeón o drill-down */
              parentCategories.map((cat, idx) => {
                const hasSubs = cat.subcategories.length > 1 || (cat.subcategories.length === 1 && cat.subcategories[0].name !== (t("category.general") || "General"));
                const isExpanded = expandedCats.has(cat.id);
                const isHovered = activeIndex === idx;

                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`rounded-xl p-2 transition-all border border-transparent ${
                      isHovered ? "bg-secondary/50 border-border/40" : "hover:bg-secondary/30"
                    }`}
                  >
                    {/* Fila principal de categoría padre */}
                    <div className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {hasSubs ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(cat.id)}
                            className="p-1 -ml-1 text-muted-foreground hover:text-foreground rounded transition-transform"
                            title={isExpanded ? "Colapsar subcategorías" : "Expandir subcategorías"}
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-0 text-primary" : "-rotate-90"
                              }`}
                            />
                          </button>
                        ) : (
                          <div className="w-3.5" />
                        )}

                        <div className={`w-6 h-6 rounded-lg ${cat.color} flex items-center justify-center shrink-0`}>
                          <CategoryIcon name={cat.icon || "circle-dot"} className="w-3.5 h-3.5 text-white" />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDrillDown(cat.id)}
                          className="text-left font-medium text-foreground text-[13px] hover:text-primary transition-colors truncate"
                          title={`Ver desglose exclusivo de ${cat.name}`}
                        >
                          {cat.name}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground font-mono-data">
                          {cat.percentageOfTotal.toFixed(1)}%
                        </span>
                        <span className="font-mono-data text-foreground font-semibold text-[13px]">
                          {formatAmount(cat.amount)}
                        </span>
                        {hasSubs && (
                          <button
                            type="button"
                            onClick={() => handleDrillDown(cat.id)}
                            className="p-1 text-muted-foreground hover:text-primary active:scale-95 transition-all"
                            title={`Drill-down: ver gráfico de ${cat.name}`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso de la categoría sobre el total */}
                    <div className="ml-7 mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.color} transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(0, cat.percentageOfTotal))}%` }}
                      />
                    </div>

                    {/* Desglose inline de subcategorías (Acordeón animado) */}
                    <AnimatePresence>
                      {hasSubs && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-7 mt-2 pl-3 border-l-2 border-border/50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-0.5 font-medium">
                            <span>{t("pie.subcategories") || "Subcategorías"}</span>
                            <button
                              type="button"
                              onClick={() => handleDrillDown(cat.id)}
                              className="text-primary hover:underline flex items-center gap-0.5 text-[10px]"
                            >
                              <span>{t("pie.viewInPie") || "Ver en torta"}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          {cat.subcategories.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between text-[12px] py-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-2 h-2 rounded-full ${sub.color}`} />
                                <span className="text-foreground/90 truncate">{sub.name}</span>
                              </div>
                              <div className="flex items-center gap-2 font-mono-data text-[11px] shrink-0">
                                <span className="text-muted-foreground">
                                  {sub.percentageOfParent.toFixed(0)}% {t("pie.ofCategory") || "del rubro"}
                                </span>
                                <span className="text-foreground font-medium">
                                  {formatAmount(sub.amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
