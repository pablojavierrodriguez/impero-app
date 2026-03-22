import { Transaction } from "@/lib/types";
import { motion } from "framer-motion";

interface SpendingBreakdownProps {
  transactions: Transaction[];
}

export function SpendingBreakdown({ transactions }: SpendingBreakdownProps) {
  const expenses = transactions.filter(t => t.type === "expense" && !t.isCardPayment && t.date.getMonth() === new Date().getMonth());
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  const byCategory = expenses.reduce<Record<string, { name: string; amount: number; color: string }>>((acc, t) => {
    if (!acc[t.category.id]) acc[t.category.id] = { name: t.category.name, amount: 0, color: t.category.color };
    acc[t.category.id].amount += t.amount;
    return acc;
  }, {});

  const sorted = Object.values(byCategory).sort((a, b) => b.amount - a.amount);

  return (
    <div className="px-4 py-4">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">Spending Distribution</h2>
      
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {sorted.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ width: 0 }}
            animate={{ width: `${(cat.amount / total) * 100}%` }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
            className={`${cat.color} ${i === 0 ? "rounded-l-full" : ""} ${i === sorted.length - 1 ? "rounded-r-full" : ""}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {sorted.map(cat => (
          <div key={cat.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`category-dot ${cat.color}`} />
              <span className="text-[13px] text-foreground">{cat.name}</span>
            </div>
            <span className="font-mono-data text-[13px] text-muted-foreground">
              ${cat.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
