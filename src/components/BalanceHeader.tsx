import { motion } from "framer-motion";

interface BalanceHeaderProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export function BalanceHeader({ totalBalance, monthlyIncome, monthlyExpenses }: BalanceHeaderProps) {
  const delta = monthlyIncome - monthlyExpenses;

  return (
    <div className="px-4 pt-4 pb-2">
      <span className="text-[12px] text-muted-foreground font-medium font-display">Current Liquidity</span>
      <motion.div
        key={totalBalance}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        className="mt-1"
      >
        <span className="font-mono-data text-[32px] text-foreground tracking-tight leading-none">
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </motion.div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">Income</span>
          <span className="font-mono-data text-[14px] text-primary">
            +${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">Expenses</span>
          <span className="font-mono-data text-[14px] text-foreground">
            -${monthlyExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">Monthly Delta</span>
          <span className={`font-mono-data text-[14px] ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
            {delta >= 0 ? "+" : ""}${delta.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
