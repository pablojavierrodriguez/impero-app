import { Transaction } from "@/lib/types";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = format(tx.date, "MMM d, yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  return (
    <div className="px-4 pb-28">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">Transactions</h2>
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="mb-4">
          <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">{date}</span>
          <div className="mt-1">
            {txs.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 40 }}
                className="transaction-row"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-[10px] ${tx.category.color} flex items-center justify-center flex-shrink-0`}>
                    <CategoryIcon name={tx.category.icon || "circle-dot"} className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] text-foreground font-medium">{tx.description}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {tx.category.name} · {format(tx.date, "h:mm a")}
                    </span>
                  </div>
                </div>
                <span className={`font-mono-data text-[14px] tracking-tight ${tx.type === "income" ? "text-primary" : "text-foreground"}`}>
                  {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
