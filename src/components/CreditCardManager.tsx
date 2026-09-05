import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Archive, ArchiveRestore, CreditCard, ArrowUpDown, DollarSign, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Account, CATEGORY_COLORS, ACCOUNT_ICONS, CreditCardBrand, CARD_BRANDS, Transaction, getStatementPeriod, getPreviousStatementPeriod, getPaymentDueDate } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { format } from "date-fns";
import { useSettings } from "@/lib/settings-store";

interface CreditCardManagerProps {
  accounts: Account[];
  getCreditCards: () => Account[];
  getArchivedAccounts: () => Account[];
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getStatementTransactions: (cardId: string, period: "current" | "previous") => Transaction[];
  getNonCardAccounts: () => Account[];
  onAdd: (account: Account) => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onPayCard: (cardId: string, fromAccountId: string, amount: number) => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

type ViewMode = "list" | "create" | "edit" | "detail" | "pay" | "archived";

export function CreditCardManager({
  accounts, getCreditCards, getArchivedAccounts, getTransactionsByAccount,
  getStatementTransactions, getNonCardAccounts,
  onAdd, onUpdate, onArchive, onUnarchive, onPayCard, onSelectTransaction,
}: CreditCardManagerProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [editingCard, setEditingCard] = useState<Account | null>(null);
  const [detailCard, setDetailCard] = useState<Account | null>(null);
  const [statementPeriod, setStatementPeriod] = useState<"current" | "previous">("current");
  const [detailTab, setDetailTab] = useState<"statement" | "plans">("statement");

  // Form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("bg-red-400");
  const [formIcon, setFormIcon] = useState("credit-card");
  const [formBrand, setFormBrand] = useState<CreditCardBrand>("visa");
  const [formCustomBrand, setFormCustomBrand] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [formClosingDay, setFormClosingDay] = useState("15");
  const [formPaymentDay, setFormPaymentDay] = useState("5");
  const [formBalance, setFormBalance] = useState("0");

  // Pay state
  const [payAmount, setPayAmount] = useState("");
  const [payFromAccount, setPayFromAccount] = useState("");

  const cards = getCreditCards();
  const archivedCards = getArchivedAccounts().filter(a => a.type === "credit");
  const sourceAccounts = getNonCardAccounts();

  const { formatAmount: formatCurrency, t } = useSettings();

  const openCreate = () => {
    setFormName("");
    setFormColor("bg-red-400");
    setFormIcon("credit-card");
    setFormBrand("visa");
    setFormCustomBrand("");
    setFormLimit("5000");
    setFormClosingDay("15");
    setFormPaymentDay("5");
    setFormBalance("0");
    setEditingCard(null);
    setView("create");
  };

  const openEdit = (card: Account) => {
    setFormName(card.name);
    setFormColor(card.color);
    setFormIcon(card.icon || "credit-card");
    setFormBrand(card.brand || "visa");
    setFormCustomBrand(card.customBrandName || "");
    setFormLimit((card.creditLimit || 0).toString());
    setFormClosingDay((card.closingDay || 15).toString());
    setFormPaymentDay((card.paymentDay || 5).toString());
    setEditingCard(card);
    setView("edit");
  };

  const openDetail = (card: Account) => {
    setDetailCard(card);
    setStatementPeriod("current");
    setView("detail");
  };

  const openPay = (card: Account) => {
    setDetailCard(card);
    const owed = Math.abs(Math.min(card.balance, 0));
    setPayAmount(owed.toFixed(2));
    setPayFromAccount(sourceAccounts[0]?.id ?? "");
    setView("pay");
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const closingDay = Math.max(1, Math.min(28, parseInt(formClosingDay) || 15));
    const paymentDay = Math.max(1, Math.min(28, parseInt(formPaymentDay) || 5));
    const creditLimit = parseFloat(formLimit) || 5000;

    if (editingCard) {
      onUpdate(editingCard.id, {
        name: formName.trim(),
        color: formColor,
        icon: formIcon,
        brand: formBrand,
        customBrandName: formBrand === "custom" ? formCustomBrand.trim() : undefined,
        creditLimit,
        closingDay,
        paymentDay,
      });
    } else {
      const balance = -(parseFloat(formBalance) || 0);
      onAdd({
        id: `card-${Date.now()}`,
        name: formName.trim(),
        balance,
        type: "credit",
        color: formColor,
        icon: formIcon,
        brand: formBrand,
        customBrandName: formBrand === "custom" ? formCustomBrand.trim() : undefined,
        creditLimit,
        closingDay,
        paymentDay,
        archived: false,
      });
    }
    setView("list");
  };

  const handlePay = () => {
    if (!detailCard || !payFromAccount) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;
    onPayCard(detailCard.id, payFromAccount, amount);
    setView("list");
  };

  const getBrandLabel = (card: Account) => {
    if (card.brand === "custom") return card.customBrandName || "Card";
    return CARD_BRANDS.find(b => b.value === card.brand)?.label || "Card";
  };

  return (
    <div className="pt-4 pb-28">
      <div className="px-4 pb-3 flex items-center justify-between">
        {view === "list" ? (
          <>
            <h1 className="text-[20px] font-display font-semibold text-foreground">Credit Cards</h1>
            <div className="flex gap-2">
              {archivedCards.length > 0 && (
                <button onClick={() => setView("archived")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Archive className="w-4 h-4" />
                </button>
              )}
              <button onClick={openCreate} className="p-2 text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => view === "detail" || view === "pay" ? setView("list") : setView("list")} className="p-1 text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[16px] font-display font-semibold text-foreground">
              {view === "create" && "New Credit Card"}
              {view === "edit" && "Edit Card"}
              {view === "archived" && "Archived Cards"}
              {view === "detail" && detailCard?.name}
              {view === "pay" && `Pay ${detailCard?.name}`}
            </h2>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* LIST VIEW */}
        {view === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
            {cards.length === 0 && (
              <p className="text-muted-foreground text-[13px] text-center py-8">No credit cards yet. Tap + to add one.</p>
            )}
            {cards.map((card, i) => {
              const owed = Math.abs(Math.min(card.balance, 0));
              const limit = card.creditLimit || 0;
              const used = limit > 0 ? (owed / limit) * 100 : 0;

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="mb-3"
                >
                  <div className="card-surface">
                    <div className="card-inner">
                      <div className="flex items-center gap-3 mb-3" onClick={() => openDetail(card)} role="button">
                        <div className={`w-10 h-10 rounded-[12px] ${card.color} flex items-center justify-center`}>
                          <CategoryIcon name={card.icon || "credit-card"} className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] text-foreground font-medium">{card.name}</span>
                            <span className="text-[11px] text-muted-foreground">{getBrandLabel(card)}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`font-mono-data text-[18px] ${owed > 0 ? "text-destructive" : "text-foreground"}`}>
                              {formatCurrency(card.balance)}
                            </span>
                            {limit > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                / {formatCurrency(limit)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Usage bar */}
                      {limit > 0 && (
                        <div className="mb-3">
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(used, 100)}%` }}
                              className={`h-full rounded-full ${used > 80 ? "bg-destructive" : used > 50 ? "bg-amber-500" : "bg-primary"}`}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {used.toFixed(0)}% used
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Available: {formatCurrency(Math.max(limit - owed, 0))}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Statement info */}
                      {card.closingDay && (
                        <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            Closes: {card.closingDay}th
                          </span>
                          <span>·</span>
                          <span>Due: {card.paymentDay}th</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => openPay(card)}
                          className="flex-1 h-9 rounded-[10px] bg-primary/10 text-primary text-[13px] font-medium flex items-center justify-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Pay
                        </button>
                        <button
                          onClick={() => openEdit(card)}
                          className="h-9 w-9 rounded-[10px] bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onArchive(card.id)}
                          className="h-9 w-9 rounded-[10px] bg-secondary flex items-center justify-center text-muted-foreground hover:text-amber-400"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* CREATE / EDIT VIEW */}
        {(view === "create" || view === "edit") && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Card Name</label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Visa Gold"
              className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
            />

            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Brand</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {CARD_BRANDS.map(b => (
                <button
                  key={b.value}
                  onClick={() => setFormBrand(b.value)}
                  className={`px-3 py-2 rounded-full text-[13px] font-medium transition-colors ${
                    formBrand === b.value ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30" : "bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {formBrand === "custom" && (
              <>
                <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Brand Name</label>
                <input
                  value={formCustomBrand}
                  onChange={e => setFormCustomBrand(e.target.value)}
                  placeholder="Bank / Wallet name"
                  className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
                />
              </>
            )}

            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Credit Limit</label>
            <input
              value={formLimit}
              onChange={e => setFormLimit(e.target.value)}
              type="number"
              step="100"
              placeholder="5000"
              className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground font-mono-data text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Closing Day</label>
                <input
                  value={formClosingDay}
                  onChange={e => setFormClosingDay(e.target.value)}
                  type="number"
                  min="1"
                  max="28"
                  className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground font-mono-data text-[14px] focus:border-muted-foreground outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Payment Day</label>
                <input
                  value={formPaymentDay}
                  onChange={e => setFormPaymentDay(e.target.value)}
                  type="number"
                  min="1"
                  max="28"
                  className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground font-mono-data text-[14px] focus:border-muted-foreground outline-none transition-colors"
                />
              </div>
            </div>

            {view === "create" && (
              <>
                <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Current Balance Owed</label>
                <input
                  value={formBalance}
                  onChange={e => setFormBalance(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground font-mono-data text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
                />
              </>
            )}

            {/* Color */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Color</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFormColor(c)}
                  className={`w-8 h-8 rounded-full ${c} transition-all ${
                    formColor === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : ""
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {ACCOUNT_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setFormIcon(ic)}
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${
                    formIcon === ic ? `${formColor} text-white ring-1 ring-foreground/30` : "bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <CategoryIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView("list")} className="flex-1 h-11 rounded-[12px] bg-secondary text-foreground font-medium text-[14px]">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="flex-[2] h-11 rounded-[12px] bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-40"
              >
                {view === "edit" ? "Save Changes" : "Create Card"}
              </button>
            </div>
          </motion.div>
        )}

        {/* PAY VIEW */}
        {view === "pay" && detailCard && (
          <motion.div key="pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            <div className="card-surface mb-4">
              <div className="card-inner">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[12px] ${detailCard.color} flex items-center justify-center`}>
                    <CategoryIcon name={detailCard.icon || "credit-card"} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[14px] text-foreground font-medium">{detailCard.name}</span>
                    <div className="text-[12px] text-muted-foreground">
                      Balance: <span className="font-mono-data text-destructive">{formatCurrency(detailCard.balance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Payment Amount</label>
            <input
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              type="number"
              step="0.01"
              className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground font-mono-data text-[16px] focus:border-muted-foreground outline-none transition-colors mb-4"
            />

            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Pay From</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {sourceAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setPayFromAccount(acc.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                    payFromAccount === acc.id
                      ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                      : "bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <div className={`category-dot ${acc.color}`} />
                  {acc.name}
                  <span className="font-mono-data text-[11px]">{formatCurrency(acc.balance)}</span>
                </button>
              ))}
            </div>

            {(() => {
              const amount = parseFloat(payAmount) || 0;
              if (amount <= 0) return null;
              return (
                <div className="text-[13px] mb-4 p-3 rounded-[12px] bg-primary/10 text-primary">
                  <span className="font-mono-data font-medium">{formatCurrency(amount)}</span> will be deducted from the source account and applied to the card balance.
                </div>
              );
            })()}

            <div className="flex gap-3">
              <button onClick={() => setView("list")} className="flex-1 h-11 rounded-[12px] bg-secondary text-foreground font-medium text-[14px]">
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={!payFromAccount || isNaN(parseFloat(payAmount)) || parseFloat(payAmount) <= 0}
                className="flex-[2] h-11 rounded-[12px] bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-40"
              >
                Pay Card
              </button>
            </div>
          </motion.div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && detailCard && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="px-4 mb-4">
              <div className="card-surface">
                <div className="card-inner">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-[14px] ${detailCard.color} flex items-center justify-center`}>
                      <CategoryIcon name={detailCard.icon || "credit-card"} className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] text-foreground font-semibold">{detailCard.name}</span>
                        <span className="text-[11px] text-muted-foreground">{getBrandLabel(detailCard)}</span>
                      </div>
                      <div className={`font-mono-data text-[22px] ${detailCard.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                        {formatCurrency(detailCard.balance)}
                      </div>
                      {detailCard.creditLimit && (
                        <span className="text-[11px] text-muted-foreground">
                          Limit: {formatCurrency(detailCard.creditLimit)} · Available: {formatCurrency(Math.max((detailCard.creditLimit || 0) + detailCard.balance, 0))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  {detailCard.closingDay && detailCard.paymentDay && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded-[10px] bg-secondary/50">
                        <span className="text-[10px] text-muted-foreground block">Closing</span>
                        <span className="text-[13px] text-foreground font-medium">Day {detailCard.closingDay}</span>
                      </div>
                      <div className="p-2 rounded-[10px] bg-secondary/50">
                        <span className="text-[10px] text-muted-foreground block">Payment Due</span>
                        <span className="text-[13px] text-foreground font-medium">Day {detailCard.paymentDay}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openPay(detailCard)}
                      className="flex-1 h-9 rounded-[10px] bg-primary/10 text-primary text-[13px] font-medium flex items-center justify-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Pay
                    </button>
                    <button
                      onClick={() => openEdit(detailCard)}
                      className="flex-1 h-9 rounded-[10px] bg-secondary text-foreground text-[13px] font-medium flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tabs: Statement vs Active Installment Plans */}
            <div className="px-4 mb-4">
              <div className="flex bg-secondary/80 p-0.5 rounded-xl border border-border/50 text-[12px]">
                <button
                  onClick={() => setDetailTab("statement")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                    detailTab === "statement"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("card.statement")}
                </button>
                <button
                  onClick={() => setDetailTab("plans")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                    detailTab === "plans"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("card.activePlans")}
                </button>
              </div>
            </div>

            {detailTab === "plans" ? (
              // Vista de Planes de Cuotas Activos
              <div className="px-4">
                {(() => {
                  const cardTxs = getTransactionsByAccount(detailCard.id).filter(
                    t => t.type === "expense" && !t.isCardPayment && t.installmentInfo?.groupId
                  );

                  // Agrupar por groupId
                  const plansMap = new Map<string, {
                    groupId: string;
                    description: string;
                    category: any;
                    totalInstallments: number;
                    txs: Transaction[];
                    installmentAmount: number;
                  }>();

                  for (const tx of cardTxs) {
                    const info = tx.installmentInfo!;
                    let plan = plansMap.get(info.groupId);
                    if (!plan) {
                      // Limpiar el sufijo (X/Y) para el nombre del bien/servicio
                      const cleanDesc = tx.description.replace(/\s*\(\d+\/\d+\)$/, "");
                      plan = {
                        groupId: info.groupId,
                        description: cleanDesc,
                        category: tx.category,
                        totalInstallments: info.total,
                        txs: [],
                        installmentAmount: tx.amount,
                      };
                      plansMap.set(info.groupId, plan);
                    }
                    plan.txs.push(tx);
                  }

                  const plans = Array.from(plansMap.values());

                  if (plans.length === 0) {
                    return (
                      <p className="text-muted-foreground text-[13px] text-center py-8">
                        {t("card.noActivePlans")}
                      </p>
                    );
                  }

                  const now = new Date();

                  return (
                    <div className="space-y-3">
                      {plans.map(plan => {
                        // Cuotas ya pasadas o en este mes vs cuotas restantes a futuro
                        const pastOrCurrentCount = plan.txs.filter(t => t.date <= now).length;
                        const paidInstallments = Math.min(pastOrCurrentCount, plan.totalInstallments);
                        const remainingCount = Math.max(0, plan.totalInstallments - paidInstallments);
                        const remainingAmount = remainingCount * plan.installmentAmount;
                        const progressPct = (paidInstallments / plan.totalInstallments) * 100;

                        return (
                          <div key={plan.groupId} className="card-surface p-3.5 border border-border/70 rounded-[14px]">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-[8px] ${plan.category.color} flex items-center justify-center text-white flex-shrink-0`}>
                                  <CategoryIcon name={plan.category.icon || "circle-dot"} className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="text-[14px] text-foreground font-medium block">{plan.description}</span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {plan.category.name} · {formatCurrency(plan.installmentAmount)} / cuota
                                  </span>
                                </div>
                              </div>
                              <span className="text-[12px] font-semibold text-primary font-mono-data">
                                {paidInstallments}/{plan.totalInstallments}
                              </span>
                            </div>

                            {/* Barra de progreso */}
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
                              <div
                                style={{ width: `${progressPct}%` }}
                                className="h-full rounded-full bg-primary transition-all duration-300"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>
                                {remainingCount > 0 ? `${remainingCount} cuotas restantes` : "Plan finalizado"}
                              </span>
                              <span className="font-mono-data font-medium text-foreground">
                                {t("card.planRemaining")}: {formatCurrency(remainingAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Vista tradicional de Resumen de Cuenta
              <>
                {/* Statement period toggle */}
                {detailCard.closingDay && (
                  <div className="px-4 mb-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setStatementPeriod("previous")}
                        disabled={statementPeriod === "previous"}
                        className="p-1 text-muted-foreground disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[13px] text-foreground font-medium">
                        {statementPeriod === "current" ? "Current Statement" : "Previous Statement"}
                        {(() => {
                          const { periodStart, periodEnd } = statementPeriod === "current"
                            ? getStatementPeriod(detailCard.closingDay!)
                            : getPreviousStatementPeriod(detailCard.closingDay!);
                          return ` (${format(periodStart, "MMM d")} – ${format(periodEnd, "MMM d")})`;
                        })()}
                      </span>
                      <button
                        onClick={() => setStatementPeriod("current")}
                        disabled={statementPeriod === "current"}
                        className="p-1 text-muted-foreground disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

            {/* Statement transactions */}
            <div className="px-4">
              <h3 className="text-[13px] text-muted-foreground font-medium mb-3">
                {detailCard.closingDay ? "Statement Charges" : "All Transactions"}
              </h3>
              {(() => {
                const txs = detailCard.closingDay
                  ? getStatementTransactions(detailCard.id, statementPeriod)
                  : getTransactionsByAccount(detailCard.id).filter(t => t.type === "expense" && !t.isCardPayment);

                const total = txs.reduce((sum, t) => sum + t.amount, 0);

                if (txs.length === 0) return <p className="text-muted-foreground text-[13px] text-center py-6">No charges in this period.</p>;

                return (
                  <>
                    <div className="mb-3 p-3 rounded-[12px] bg-secondary/50">
                      <span className="text-[12px] text-muted-foreground">Total charges</span>
                      <span className="font-mono-data text-[18px] text-destructive ml-2">{formatCurrency(total)}</span>
                    </div>
                    {txs.map(tx => (
                      <div
                        key={tx.id}
                        className={`transaction-row ${onSelectTransaction ? "cursor-pointer active:bg-secondary/50" : ""}`}
                        onClick={() => onSelectTransaction?.(tx)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-[10px] ${tx.category.color} flex items-center justify-center flex-shrink-0`}>
                            <CategoryIcon name={tx.category.icon || "circle-dot"} className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] text-foreground font-medium">{tx.description}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {tx.category.name} · {format(tx.date, "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono-data text-[14px] tracking-tight text-foreground">
                          -${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </>
                );
              })()}

              {/* Payments */}
              {(() => {
                const payments = getTransactionsByAccount(detailCard.id).filter(t => t.isCardPayment && t.type === "income");
                if (payments.length === 0) return null;
                return (
                  <>
                    <h3 className="text-[13px] text-muted-foreground font-medium mb-3 mt-6">Payments</h3>
                    {payments.map(tx => (
                      <div key={tx.id} className="transaction-row">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[10px] bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] text-foreground font-medium">{tx.description}</span>
                            <span className="text-[11px] text-muted-foreground">{format(tx.date, "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                        <span className="font-mono-data text-[14px] tracking-tight text-primary">
                          +${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </>
        )}
      </motion.div>
    )}

        {/* ARCHIVED VIEW */}
        {view === "archived" && (
          <motion.div key="archived" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            {archivedCards.length === 0 && (
              <p className="text-muted-foreground text-[13px] text-center py-8">No archived cards.</p>
            )}
            {archivedCards.map(card => (
              <div key={card.id} className="flex items-center justify-between py-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-[10px] ${card.color} opacity-50 flex items-center justify-center`}>
                    <CategoryIcon name={card.icon || "credit-card"} className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[14px] text-muted-foreground">{card.name}</span>
                </div>
                <button onClick={() => onUnarchive(card.id)} className="p-2 text-muted-foreground hover:text-primary">
                  <ArchiveRestore className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
