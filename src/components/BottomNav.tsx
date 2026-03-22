import { motion } from "framer-motion";
import { LayoutDashboard, ArrowLeftRight, CreditCard, Plus, Tags, Wallet, Repeat } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onQuickAdd: () => void;
  onTransfer: () => void;
}

const tabs = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "transactions", icon: ArrowLeftRight, label: "History" },
  { id: "cards", icon: CreditCard, label: "Cards" },
  { id: "categories", icon: Tags, label: "Categories" },
  { id: "accounts", icon: Wallet, label: "Accounts" },
];

export function BottomNav({ activeTab, onTabChange, onQuickAdd, onTransfer }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-card/95 backdrop-blur-lg border-t border-border/50">
        <div className="flex items-center justify-around px-1 h-16 max-w-md mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-14 h-12 relative"
            >
              <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[9px] mt-0.5 transition-colors ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                />
              )}
            </button>
          ))}
          {/* Transfer button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onTransfer}
            className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center -mt-3"
          >
            <Repeat className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          {/* FAB */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onQuickAdd}
            className="h-12 w-12 rounded-full bg-primary flex items-center justify-center fab-glow -mt-3"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
