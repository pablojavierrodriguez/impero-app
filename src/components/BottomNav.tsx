import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ArrowLeftRight, Wallet, Plus, MoreHorizontal } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { CreditCard, Tags, Repeat, Receipt, Settings, PiggyBank, Target, Bell, BarChart3, Hash, Zap, ShoppingCart, Upload } from "lucide-react";
import { useSettings } from "@/lib/settings-store";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onQuickAdd: (initialType?: "expense" | "income") => void;
  onTransfer: () => void;
  onImportCsv?: () => void;
  pendingBillsCount?: number;
}

export function BottomNav({ activeTab, onTabChange, onQuickAdd, onTransfer, onImportCsv, pendingBillsCount = 0 }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const { t } = useSettings();

  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: t("nav.home") },
    { id: "transactions", icon: ArrowLeftRight, label: t("nav.history") },
    { id: "accounts", icon: Wallet, label: t("nav.accounts") },
  ];

  const moreItems = [
    { id: "budgets", icon: PiggyBank, label: t("nav.budgets"), desc: t("nav.budgetsDesc") },
    { id: "goals", icon: Target, label: t("nav.goals"), desc: t("nav.goalsDesc") },
    { id: "recurring", icon: Repeat, label: t("nav.recurring"), desc: t("nav.recurringDesc") },
    { id: "bills", icon: Bell, label: t("nav.bills"), desc: t("nav.billsDesc"), badge: pendingBillsCount },
    { id: "reports", icon: BarChart3, label: t("nav.reports"), desc: t("nav.reportsDesc") },
    { id: "cards", icon: CreditCard, label: t("nav.cards"), desc: t("nav.cardsDesc") },
    { id: "categories", icon: Tags, label: t("nav.categories"), desc: t("nav.categoriesDesc") },
    { id: "tags", icon: Hash, label: t("nav.tags"), desc: t("nav.tagsDesc") },
    { id: "rules", icon: Zap, label: "Reglas", desc: "Automatizaciones y auto-categorización" },
    { id: "shopping", icon: ShoppingCart, label: "Listas de Compras", desc: "Organizar compras y registrar gastos" },
    ...(onImportCsv
      ? [{ id: "import-csv", icon: Upload, label: t("tx.importCsv") || "Importar CSV", desc: "Carga extractos bancarios y billeteras", isAction: true, onClick: onImportCsv }]
      : []),
    { id: "settings", icon: Settings, label: t("nav.settings"), desc: t("nav.settingsDesc") },
  ];

  const moreTabIds = moreItems.map(i => i.id);

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col justify-end p-6 pb-24 items-center"
            onClick={() => setFabOpen(false)}
          >
            <div className="w-full max-w-xs flex flex-col gap-3">
              {/* Opción 1: GASTO */}
              <motion.button
                initial={{ opacity: 0, y: 30, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.85 }}
                transition={{ delay: 0.04 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFabOpen(false);
                  onQuickAdd("expense");
                }}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-foreground hover:bg-destructive/25 active:scale-98 transition-all shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground shadow-sm">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-foreground">Nuevo Gasto</span>
                    <span className="text-[11px] text-muted-foreground block">Registrar salida de dinero</span>
                  </div>
                </div>
                <span className="text-destructive text-lg font-bold">−</span>
              </motion.button>

              {/* Opción 2: INGRESO */}
              <motion.button
                initial={{ opacity: 0, y: 30, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.85 }}
                transition={{ delay: 0.08 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFabOpen(false);
                  onQuickAdd("income");
                }}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-primary/15 border border-primary/30 text-foreground hover:bg-primary/25 active:scale-98 transition-all shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-foreground">Nuevo Ingreso</span>
                    <span className="text-[11px] text-muted-foreground block">Sueldo, cobro o rendimientos</span>
                  </div>
                </div>
                <span className="text-primary text-lg font-bold">+</span>
              </motion.button>

              {/* Opción 3: TRANSFERENCIA (Azul) */}
              <motion.button
                initial={{ opacity: 0, y: 30, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.85 }}
                transition={{ delay: 0.12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFabOpen(false);
                  onTransfer();
                }}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-foreground hover:bg-sky-500/25 active:scale-98 transition-all shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-sm">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block text-foreground">{t("nav.transfer")}</span>
                    <span className="text-[11px] text-muted-foreground block">Mover fondos entre cuentas</span>
                  </div>
                </div>
                <span className="text-sky-500 text-lg font-bold">⇄</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-card/95 backdrop-blur-lg border-t border-border/50 pb-safe">
          <div className="flex items-center justify-around px-1 h-16 max-w-md mx-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center w-14 h-12 relative">
                <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[9px] mt-0.5 transition-colors ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="nav-indicator" className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 40 }} />
                )}
              </button>
            ))}

            <button onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center w-14 h-12 relative">
              <MoreHorizontal className={`w-5 h-5 transition-colors ${moreTabIds.includes(activeTab) ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[9px] mt-0.5 transition-colors ${moreTabIds.includes(activeTab) ? "text-primary" : "text-muted-foreground"}`}>{t("nav.more")}</span>
              {pendingBillsCount > 0 && (
                <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-medium">
                  {pendingBillsCount}
                </span>
              )}
              {moreTabIds.includes(activeTab) && (
                <motion.div layoutId="nav-indicator" className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 40 }} />
              )}
            </button>

            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setFabOpen(prev => !prev)}
              className="h-12 w-12 rounded-full bg-primary flex items-center justify-center fab-glow -mt-3">
              <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                <Plus className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-5 pt-6 pb-4 border-b border-border/50">
            <SheetTitle className="text-base font-display">{t("nav.moreOptions")}</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">{t("nav.advancedMgmt")}</SheetDescription>
          </SheetHeader>
          <div className="py-2 overflow-auto max-h-[calc(100vh-100px)]">
            {moreItems.map(item => (
              <button key={item.id}
                onClick={() => {
                  if ("onClick" in item && typeof item.onClick === "function") {
                    item.onClick();
                  } else {
                    onTabChange(item.id);
                  }
                  setMoreOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/50 ${
                  activeTab === item.id ? "bg-secondary text-primary" : "text-foreground"
                }`}>
                <item.icon className="w-5 h-5" />
                <div className="text-left flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
