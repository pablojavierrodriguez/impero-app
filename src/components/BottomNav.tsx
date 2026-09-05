import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ArrowLeftRight, Wallet, Plus, MoreHorizontal } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { CreditCard, Tags, Repeat, Receipt, Settings, PiggyBank, Target, Bell, BarChart3, Hash, Zap } from "lucide-react";
import { useSettings } from "@/lib/settings-store";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onQuickAdd: () => void;
  onTransfer: () => void;
  pendingBillsCount?: number;
}

export function BottomNav({ activeTab, onTabChange, onQuickAdd, onTransfer, pendingBillsCount = 0 }: BottomNavProps) {
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
    { id: "settings", icon: Settings, label: t("nav.settings"), desc: t("nav.settingsDesc") },
  ];

  const moreTabIds = moreItems.map(i => i.id);

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={() => setFabOpen(false)}>
            <div className="absolute bottom-20 right-4 flex flex-col gap-3 items-end">
              <motion.button initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.05 }}
                onClick={(e) => { e.stopPropagation(); setFabOpen(false); onTransfer(); }}
                className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-full border border-border/50">{t("nav.transfer")}</span>
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-foreground" />
                </div>
              </motion.button>
              <motion.button initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.1 }}
                onClick={(e) => { e.stopPropagation(); setFabOpen(false); onQuickAdd(); }}
                className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-full border border-border/50">{t("nav.newExpense")}</span>
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-foreground" />
                </div>
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
                onClick={() => { onTabChange(item.id); setMoreOpen(false); }}
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
