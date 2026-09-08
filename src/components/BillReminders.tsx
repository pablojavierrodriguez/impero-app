import { useState } from "react";
import { Plus, Trash2, Check, AlertCircle, Clock, Pencil, X } from "lucide-react";
import { motion } from "framer-motion";
import { BillReminder, Account, Category, type RecurrenceFrequency } from "@/lib/types";
import { useSettings } from "@/lib/settings-store";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

interface BillRemindersProps {
  bills: BillReminder[];
  accounts: Account[];
  categories: Category[];
  onAdd: (bill: BillReminder) => void;
  onUpdate: (id: string, updates: Partial<BillReminder>) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string, accountId: string) => void;
  getPendingBills: () => BillReminder[];
}

const FREQUENCIES: RecurrenceFrequency[] = ["monthly", "weekly", "biweekly", "yearly"];

export function BillReminders({
  bills, accounts, categories, onAdd, onUpdate, onDelete, onMarkPaid, getPendingBills,
}: BillRemindersProps) {
  const { formatAmount, t } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [freq, setFreq] = useState<RecurrenceFrequency>("monthly");
  const [catId, setCatId] = useState("");
  const [accId, setAccId] = useState(accounts[0]?.id ?? "");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAccId, setPayAccId] = useState(accounts[0]?.id ?? "");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const freqLabel = (f: RecurrenceFrequency) => t(`recurring.${f}` as any);
  const pending = getPendingBills();

  const handleStartEdit = (bill: BillReminder) => {
    setEditingId(bill.id);
    setName(bill.name);
    setAmount(bill.amount.toString());
    setDueDate(format(new Date(bill.dueDate), "yyyy-MM-dd"));
    setFreq(bill.frequency);
    setCatId(bill.categoryId || "");
    setAccId(bill.accountId || accounts[0]?.id || "");
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setName("");
    setAmount("");
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!name || !parseFloat(amount)) return;
    const due = parseLocalDate(dueDate);
    if (editingId) {
      onUpdate(editingId, {
        name,
        amount: parseFloat(amount),
        dueDate: due,
        frequency: freq,
        categoryId: catId || undefined,
        accountId: accId,
      });
      handleCancelForm();
      return;
    }
    onAdd({
      id: Date.now().toString(),
      name,
      amount: parseFloat(amount),
      dueDate: due,
      frequency: freq,
      categoryId: catId || undefined,
      accountId: accId,
      status: "pending",
      autoPay: false,
    });
    handleCancelForm();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "paid": return <Check className="w-3.5 h-3.5 text-primary" />;
      case "overdue": return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      default: return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-primary";
      case "overdue": return "text-destructive";
      default: return "text-amber-500";
    }
  };

  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-display font-semibold text-foreground">{t("bill.title")}</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{t("bill.subtitle")}</p>
        </div>
        <button onClick={() => showForm ? handleCancelForm() : setShowForm(true)}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          {showForm ? <X className="w-4 h-4 text-primary-foreground" /> : <Plus className="w-4 h-4 text-primary-foreground" />}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
          {editingId && (
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
              <span className="text-xs font-semibold text-primary">{t("common.edit")}</span>
              <button onClick={handleCancelForm} className="text-xs text-muted-foreground hover:text-foreground">
                {t("common.cancel")}
              </button>
            </div>
          )}
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t("bill.namePlaceholder")}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={t("txedit.amount")}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("bill.dueDate")}</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none" />
          <label className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("recurring.frequency")}</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FREQUENCIES.map(f => (
              <button key={f} onClick={() => setFreq(f)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  freq === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                {freqLabel(f)}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={!name || !parseFloat(amount)}
            className="w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium disabled:opacity-40">
            {t("common.save")}
          </button>
        </motion.div>
      )}

      <div className="px-4 space-y-3">
        {pending.length === 0 && !showForm && (
          <p className="text-center text-[13px] text-muted-foreground py-8">{t("bill.noBills")}</p>
        )}
        {pending.map(bill => (
          <motion.div key={bill.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-[16px] bg-card border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {statusIcon(bill.status)}
                <div>
                  <span className="text-[14px] font-medium text-foreground">{bill.name}</span>
                  <div className="text-[11px] text-muted-foreground">
                    {freqLabel(bill.frequency)} · {format(new Date(bill.dueDate), "MMM d")}
                  </div>
                </div>
              </div>
              <span className="font-mono-data text-[14px] text-foreground">{formatAmount(bill.amount)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[11px] font-medium ${statusColor(bill.status)}`}>
                {t(`bill.${bill.status}` as any)}
              </span>
              <div className="flex gap-1">
                {bill.status !== "paid" && (
                  payingId === bill.id ? (
                    <div className="flex gap-1">
                      <select value={payAccId} onChange={e => setPayAccId(e.target.value)}
                        className="h-7 text-[11px] bg-secondary border-0 rounded-lg px-2 text-foreground">
                        {accounts.filter(a => a.type !== "credit" && !a.archived).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <button onClick={() => { onMarkPaid(bill.id, payAccId); setPayingId(null); }}
                        className="h-7 px-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setPayingId(bill.id)}
                      className="h-7 px-3 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors">
                      {t("bill.markPaid")}
                    </button>
                  )
                )}
                <button
                  onClick={() => handleStartEdit(bill)}
                  title={t("common.edit")}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {confirmDeleteId === bill.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => { onDelete(bill.id); setConfirmDeleteId(null); }}
                      className="px-2 py-0.5 rounded text-[11px] bg-destructive text-destructive-foreground font-medium transition-colors"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(bill.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Dashboard widget
export function BillsSummaryWidget({ bills }: { bills: BillReminder[] }) {
  const { formatAmount, t } = useSettings();
  const now = new Date();
  const upcoming = bills.filter(b => {
    const due = new Date(b.dueDate);
    return b.status !== "paid" && due >= now;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">{t("dash.upcomingBills")}</h2>
      <div className="space-y-2">
        {upcoming.map(bill => {
          const due = new Date(bill.dueDate);
          const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <div key={bill.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-[13px] text-foreground">{bill.name}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    {daysUntil <= 0 ? t("bill.dueToday") : `${daysUntil}d`}
                  </span>
                </div>
              </div>
              <span className="font-mono-data text-[13px] text-foreground">{formatAmount(bill.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
