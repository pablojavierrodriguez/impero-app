import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { AnimatedNumber } from "./AnimatedNumber";

interface BalanceHeaderProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const HIDDEN = "••••••";

export function BalanceHeader({ totalBalance, monthlyIncome, monthlyExpenses }: BalanceHeaderProps) {
  const { formatAmount, t } = useSettings();
  const [visible, setVisible] = useState(true);
  const delta = monthlyIncome - monthlyExpenses;

  const fmt = useCallback((n: number) => formatAmount(n), [formatAmount]);

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground font-medium font-display">{t("balance.title")}</span>
        <button onClick={() => setVisible(v => !v)}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? t("balance.hide") : t("balance.show")}>
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      <div className="mt-1">
        {visible ? (
          <AnimatedNumber
            value={totalBalance}
            formatter={fmt}
            className="font-mono-data text-[32px] text-foreground tracking-tight leading-none"
          />
        ) : (
          <span className="font-mono-data text-[32px] text-foreground tracking-tight leading-none">{HIDDEN}</span>
        )}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t("balance.income")}</span>
          <span className="font-mono-data text-[14px] text-primary">
            {visible ? `+${formatAmount(monthlyIncome)}` : HIDDEN}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t("balance.expenses")}</span>
          <span className="font-mono-data text-[14px] text-foreground">
            {visible ? `-${formatAmount(monthlyExpenses)}` : HIDDEN}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t("balance.delta")}</span>
          <span className={`font-mono-data text-[14px] ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
            {visible ? `${delta >= 0 ? "+" : "-"}${formatAmount(Math.abs(delta))}` : HIDDEN}
          </span>
        </div>
      </div>
    </div>
  );
}
