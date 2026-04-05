import { motion } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, Target,
  Repeat, Bell, BarChart3, CreditCard, Tags, Hash, Settings, Plus, Repeat as RepeatIcon
} from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onQuickAdd: () => void;
  onTransfer: () => void;
  pendingBillsCount?: number;
}

export function DesktopSidebar({ activeTab, onTabChange, onQuickAdd, onTransfer, pendingBillsCount = 0 }: DesktopSidebarProps) {
  const { t } = useSettings();

  const mainTabs = [
    { id: "dashboard", icon: LayoutDashboard, label: t("nav.home") },
    { id: "transactions", icon: ArrowLeftRight, label: t("nav.history") },
    { id: "accounts", icon: Wallet, label: t("nav.accounts") },
  ];

  const moreItems = [
    { id: "budgets", icon: PiggyBank, label: t("nav.budgets") },
    { id: "goals", icon: Target, label: t("nav.goals") },
    { id: "recurring", icon: Repeat, label: t("nav.recurring") },
    { id: "bills", icon: Bell, label: t("nav.bills"), badge: pendingBillsCount },
    { id: "reports", icon: BarChart3, label: t("nav.reports") },
    { id: "cards", icon: CreditCard, label: t("nav.cards") },
    { id: "categories", icon: Tags, label: t("nav.categories") },
    { id: "tags", icon: Hash, label: t("nav.tags") },
    { id: "settings", icon: Settings, label: t("nav.settings") },
  ];

  const allTabs = [...mainTabs, ...moreItems];

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 bg-card border-r border-border/50 p-4 gap-1">
      <div className="mb-4 px-3">
        <h1 className="text-lg font-display font-bold text-foreground tracking-tight">💰 FinanceApp</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" className="flex-1 gap-1.5" onClick={onQuickAdd}>
          <Plus className="w-4 h-4" />
          {t("nav.newExpense")}
        </Button>
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={onTransfer}>
          <RepeatIcon className="w-4 h-4" />
        </Button>
      </div>

      {mainTabs.map(tab => (
        <SidebarItem
          key={tab.id}
          icon={tab.icon}
          label={tab.label}
          active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}

      <Separator className="my-2" />

      {moreItems.map(tab => (
        <SidebarItem
          key={tab.id}
          icon={tab.icon}
          label={tab.label}
          active={activeTab === tab.id}
          badge={tab.badge}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </aside>
  );
}

function SidebarItem({ icon: Icon, label, active, badge, onClick }: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
        />
      )}
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
