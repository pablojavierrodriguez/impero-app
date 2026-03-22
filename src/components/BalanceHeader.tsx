import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

interface BalanceHeaderProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const HIDDEN = "••••••";

export function BalanceHeader({ totalBalance, monthlyIncome, monthlyExpenses }: BalanceHeaderProps) {
  const [visible, setVisible] = useState(true);
  const delta = monthlyIncome - monthlyExpenses;

  const fmt = (n: number, prefix = "") =>
    visible ? `${prefix}$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : HIDDEN;

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground font-medium font-display">Current Liquidity</span>
        <button
          onClick={() => setVisible(v => !v)}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? "Hide balances" : "Show balances"}
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      <motion.div
        key={totalBalance}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        className="mt-1"
      >
        <span className="font-mono-data text-[32px] text-foreground tracking-tight leading-none">
          {fmt(totalBalance)}
        </span>
      </motion.div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">Income</span>
          <span className="font-mono-data text-[14px] text-primary">{fmt(monthlyIncome, "+")}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">Expenses</span>
          <span className="font-mono-data text-[14px] text-foreground">{fmt(monthlyExpenses, "-")}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">Monthly Delta</span>
          <span className={`font-mono-data text-[14px] ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
            {fmt(Math.abs(delta), delta >= 0 ? "+" : "-")}
          </span>
        </div>
      </div>
    </div>
  );
}