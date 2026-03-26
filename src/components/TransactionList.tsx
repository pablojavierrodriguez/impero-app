import { Transaction } from "@/lib/types";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";
import { useMemo, useCallback, memo } from "react";

interface TransactionListProps {
  transactions: Transaction[];
  onSelect?: (tx: Transaction) => void;
}

interface TransactionRowProps {
  tx: Transaction;
  index: number;
  onSelect?: (tx: Transaction) => void;
  formatAmount: (amount: number, opts: any) => string;
}

const TransactionRow = memo(function TransactionRow({ tx, index, onSelect, formatAmount }: TransactionRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.1), type: "spring", stiffness: 400, damping: 40 }}
      className={`transaction-row ${onSelect ? "cursor-pointer active:bg-secondary/50" : ""}`}
      onClick={() => onSelect?.(tx)}
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
        {formatAmount(tx.amount, { sign: tx.type === "income" ? "+" : "-" })}
      </span>
    </motion.div>
  );
});

export function TransactionList({ transactions, onSelect }: TransactionListProps) {
  const { formatAmount, t } = useSettings();

  const grouped = useMemo(() => {
    return transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
      const key = format(tx.date, "MMM d, yyyy");
      if (!acc[key]) acc[key] = [];
      acc[key].push(tx);
      return acc;
    }, {});
  }, [transactions]);

  const groupedEntries = useMemo(() => Object.entries(grouped), [grouped]);

  return (
    <div className="px-4 pb-28">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">{t("tx.title")}</h2>
      {groupedEntries.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-muted-foreground">{t("tx.empty") || "No transactions"}</p>
        </div>
      ) : (
        groupedEntries.map(([date, txs], groupIndex) => (
          <div key={date} className="mb-4">
            <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">{date}</span>
            <div className="mt-1">
              {txs.map((tx, i) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  index={groupIndex * 10 + i}
                  onSelect={onSelect}
                  formatAmount={formatAmount}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
