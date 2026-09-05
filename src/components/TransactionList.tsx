import { Transaction, Account, getStatementPeriod, getPaymentDueDate } from "@/lib/types";
import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { format } from "date-fns";
import { CategoryIcon } from "./CategoryIcon";
import { Trash2, Pencil, ArrowLeftRight, CreditCard, ChevronDown, DollarSign } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { EmptyState } from "./EmptyState";

interface TransactionListProps {
  transactions: Transaction[];
  accounts?: Account[];
  onSelect?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  onPayStatement?: (cardId: string, amount: number) => void;
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
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>{tx.category.name} · {format(tx.date, "h:mm a")}</span>
              {tx.installmentInfo && (
                <span className="text-primary font-medium">
                  ({tx.installmentInfo.current}/{tx.installmentInfo.total})
                </span>
              )}
              {tx.receiptUrl && (
                <span className="text-primary/70" title="Tiene comprobante adjunto">
                  📎
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

// Fila de resumen de tarjeta de crédito que se ve exactamente como cualquier otro gasto
function StatementGroupRow({
  group,
  formatAmount,
  onSelect,
  isExpanded,
  onToggleExpand,
  onPay,
}: {
  group: {
    id: string;
    account: Account;
    periodEnd: Date;
    total: number;
    txs: Transaction[];
  };
  formatAmount: (n: number, opts?: { sign?: string }) => string;
  onSelect?: (tx: Transaction) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPay?: (cardId: string, amount: number) => void;
}) {
  const { account, periodEnd, total, txs } = group;

  return (
    <div className="mb-1">
      <div
        className="transaction-row bg-background cursor-pointer active:bg-secondary/40 select-none flex items-center justify-between"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-[10px] ${account.color} flex items-center justify-center flex-shrink-0 text-white`}>
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] text-foreground font-medium">
                Resumen {account.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                {txs.length}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>Cierre {format(periodEnd, "MMM d")} · {txs.length} consumos</span>
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </span>
          </div>
        </div>
        <span className="font-mono-data text-[14px] tracking-tight text-foreground">
          {formatAmount(total, { sign: "-" })}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-6 pr-2 py-1 bg-secondary/15 border-l-2 border-border/70 my-1 rounded-r-lg divide-y divide-border/20"
          >
            {txs.map(tx => (
              <div
                key={tx.id}
                onClick={() => onSelect?.(tx)}
                className="py-2 px-2 flex items-center justify-between cursor-pointer hover:bg-secondary/40 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-[6px] ${tx.category.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <CategoryIcon name={tx.category.icon || "circle-dot"} className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-[13px] text-foreground font-medium block">{tx.description}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {tx.category.name} · {format(tx.date, "MMM d")}
                      {tx.installmentInfo && ` (${tx.installmentInfo.current}/${tx.installmentInfo.total})`}
                    </span>
                  </div>
                </div>
                <span className="font-mono-data text-[13px] text-foreground">
                  {formatAmount(tx.amount, { sign: "-" })}
                </span>
              </div>
            ))}
            {onPay && total > 0 && (
              <div className="py-2.5 px-2 flex items-center justify-between bg-primary/5 rounded-md mt-1">
                <span className="text-xs text-muted-foreground font-medium">¿Liquidar resumen?</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPay(account.id, total);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-all shadow-xs"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Pagar {formatAmount(total)}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ListItem =
  | { kind: "transaction"; tx: Transaction }
  | {
      kind: "statement";
      id: string;
      account: Account;
      periodEnd: Date;
      total: number;
      txs: Transaction[];
    };

export function TransactionList({ transactions, accounts = [], onSelect, onDelete, onPayStatement }: TransactionListProps) {
  const { formatAmount: baseFormatAmount, t } = useSettings();
  const { maskAmount } = usePrivacy();
  const formatAmount = (n: number, opts?: { sign?: string }) => maskAmount(baseFormatAmount(n, opts));
  const [viewMode, setViewMode] = useState<"detailed" | "grouped">("detailed");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const creditCardAccountIds = new Set(
    accounts.filter(a => a.type === "credit").map(a => a.id)
  );

  const hasCreditCards = accounts.some(a => a.type === "credit");
  const hasCreditTransactions = transactions.some(
    tx => creditCardAccountIds.has(tx.accountId)
  );
  const showGroupingToggle = hasCreditCards || hasCreditTransactions;

  const toggleCardExpand = (groupId: string) => {
    setExpandedCards(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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

  // 1. Modo desglosado estándar (por fecha)
  const detailedGroupedByDate = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = format(tx.date, "MMM d, yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  // 2. Modo agrupado por resumen de tarjeta
  // Cada compra con tarjeta se asocia a su ciclo de facturación (resumen) según closingDay
  const statementGroupsMap = new Map<string, {
    id: string;
    account: Account;
    periodEnd: Date;
    total: number;
    txs: Transaction[];
  }>();

  const nonCardTransactions: Transaction[] = [];

  for (const tx of transactions) {
    const isCreditExpense = creditCardAccountIds.has(tx.accountId) && tx.type === "expense" && !tx.isCardPayment;
    if (isCreditExpense) {
      const account = accounts.find(a => a.id === tx.accountId) || {
        id: tx.accountId,
        name: "Credit Card",
        balance: 0,
        type: "credit",
        color: "bg-red-400",
      };

      const closingDay = account.closingDay || 15;
      const { periodEnd } = getStatementPeriod(closingDay, tx.date);
      const statementKey = `${account.id}-${periodEnd.getFullYear()}-${periodEnd.getMonth()}-${periodEnd.getDate()}`;

      let group = statementGroupsMap.get(statementKey);
      if (!group) {
        group = {
          id: statementKey,
          account,
          periodEnd,
          total: 0,
          txs: [],
        };
        statementGroupsMap.set(statementKey, group);
      }
      group.txs.push(tx);
      group.total += tx.amount;
    } else {
      nonCardTransactions.push(tx);
    }
  }

  // Integrar items agrupados por resumen dentro de la línea de tiempo por fecha
  const timelineGroupedByDate: Record<string, ListItem[]> = {};

  // Insertar resúmenes consolidados en la fecha de cierre de cada resumen
  for (const group of statementGroupsMap.values()) {
    const dateKey = format(group.periodEnd, "MMM d, yyyy");
    if (!timelineGroupedByDate[dateKey]) timelineGroupedByDate[dateKey] = [];
    timelineGroupedByDate[dateKey].push({ kind: "statement", ...group });
  }

  // Insertar las demás transacciones normales (débito, efectivo, transferencias, pagos)
  for (const tx of nonCardTransactions) {
    const dateKey = format(tx.date, "MMM d, yyyy");
    if (!timelineGroupedByDate[dateKey]) timelineGroupedByDate[dateKey] = [];
    timelineGroupedByDate[dateKey].push({ kind: "transaction", tx });
  }

  return (
    <div className="px-4 pb-28">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] text-muted-foreground font-medium font-display">{t("tx.title")}</h2>
        {showGroupingToggle && (
          <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border/50 text-[11px]">
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === "detailed"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tx.viewDetailed")}
            </button>
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === "grouped"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tx.viewGrouped")}
            </button>
          </div>
        )}
      </div>

      {viewMode === "detailed" ? (
        // Modo desglosado estándar
        Object.entries(detailedGroupedByDate).map(([date, txs]) => (
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
        ))
      ) : (
        // Modo agrupado por resumen con apariencia idéntica a cualquier otro gasto
        Object.entries(timelineGroupedByDate).map(([date, items]) => (
          <div key={date} className="mb-4">
            <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">{date}</span>
            <div className="mt-1">
              {items.map((item, i) => (
                <motion.div
                  key={item.kind === "statement" ? item.id : item.tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 40 }}
                >
                  {item.kind === "statement" ? (
                    <StatementGroupRow
                      group={item}
                      formatAmount={formatAmount}
                      onSelect={onSelect}
                      isExpanded={!!expandedCards[item.id]}
                      onToggleExpand={() => toggleCardExpand(item.id)}
                      onPay={onPayStatement}
                    />
                  ) : (
                    <SwipeableTransaction
                      tx={item.tx}
                      onSelect={onSelect}
                      onDelete={onDelete}
                      formatAmount={formatAmount}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
