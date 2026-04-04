import { Transaction } from "@/lib/types";
import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { format } from "date-fns";
import { CategoryIcon } from "./CategoryIcon";
import { Trash2, Pencil, ArrowLeftRight } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { EmptyState } from "./EmptyState";

interface TransactionListProps {
  transactions: Transaction[];
  onSelect?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

function SwipeableTransaction({
  tx, onSelect, onDelete, formatAmount,
}: {
  tx: Transaction;
  onSelect?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  formatAmount: (n: number, opts?: { sign?: string }) => string;
}) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-120, -60], [1, 0]);
  const editOpacity = useTransform(x, [60, 120], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100 && onDelete) {
      onDelete(tx.id);
    } else if (info.offset.x > 100 && onSelect) {
      onSelect(tx);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-destructive/10 rounded-r-xl">
        <Trash2 className="w-4 h-4 text-destructive" />
      </motion.div>
      {/* Edit background */}
      <motion.div style={{ opacity: editOpacity }}
        className="absolute inset-y-0 left-0 w-20 flex items-center justify-center bg-primary/10 rounded-l-xl">
        <Pencil className="w-4 h-4 text-primary" />
      </motion.div>

      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="transaction-row bg-background relative z-10 cursor-grab active:cursor-grabbing"
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
              {tx.installmentInfo && (
                <span className="text-primary ml-1">
                  {tx.installmentInfo.current}/{tx.installmentInfo.total}
                </span>
              )}
            </span>
          </div>
        </div>
        <span className={`font-mono-data text-[14px] tracking-tight ${tx.type === "income" ? "text-primary" : "text-foreground"}`}>
          {formatAmount(tx.amount, { sign: tx.type === "income" ? "+" : "-" })}
        </span>
      </motion.div>
    </div>
  );
}

export function TransactionList({ transactions, onSelect, onDelete }: TransactionListProps) {
  const { formatAmount, t } = useSettings();

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = format(tx.date, "MMM d, yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  if (transactions.length === 0) {
    return (
      <div className="px-4 pb-28">
        <EmptyState
          icon={ArrowLeftRight}
          title={t("common.noData")}
          description={t("tx.title")}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-28">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">{t("tx.title")}</h2>
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
              >
                <SwipeableTransaction
                  tx={tx}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  formatAmount={formatAmount}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
