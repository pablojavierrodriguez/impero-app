import { useState } from "react";
import { Plus, Trash2, Pause, Play, Pencil, X } from "lucide-react";
import { motion } from "framer-motion";
import { RecurringTransaction, Category, Account, type RecurrenceFrequency } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

interface RecurringManagerProps {
  recurringTxs: RecurringTransaction[];
  categories: Category[];
  accounts: Account[];
  onAdd: (rtx: RecurringTransaction) => void;
  onUpdate: (id: string, updates: Partial<RecurringTransaction>) => void;
  onDelete: (id: string) => void;
  onTogglePause: (id: string) => void;
}

const FREQUENCIES: RecurrenceFrequency[] = ["daily", "weekly", "biweekly", "monthly", "yearly"];

export function RecurringManager({
  recurringTxs, categories, accounts, onAdd, onUpdate, onDelete, onTogglePause,
}: RecurringManagerProps) {
  const { formatAmount, t } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [catId, setCatId] = useState("");
  const [accId, setAccId] = useState(accounts[0]?.id ?? "");
  const [freq, setFreq] = useState<RecurrenceFrequency>("monthly");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredCats = categories.filter(c => c.type === type && !c.archived);

  const freqLabel = (f: RecurrenceFrequency) => t(`recurring.${f}` as any);

  const handleStartEdit = (rtx: RecurringTransaction) => {
    setEditingId(rtx.id);
    setType(rtx.type);
    setAmount(rtx.amount.toString());
    setDesc(rtx.description);
    setCatId(rtx.category.id);
    setAccId(rtx.accountId);
    setFreq(rtx.frequency);
    setStartDate(format(new Date(rtx.nextDate), "yyyy-MM-dd"));
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setAmount("");
    setDesc("");
    setCatId("");
    setShowForm(false);
  };

  const handleSubmit = () => {
    const selectedAccId = accId || accounts[0]?.id;
    const cat = categories.find(c => c.id === catId);
    if (!cat || !parseFloat(amount) || !selectedAccId) return;
    const start = parseLocalDate(startDate);
    const selectedAccount = accounts.find(a => a.id === selectedAccId);

    if (editingId) {
      onUpdate(editingId, {
        amount: parseFloat(amount),
        description: desc || cat.name,
        category: cat,
        type,
        accountId: selectedAccId,
        frequency: freq,
        nextDate: start,
        currency: (selectedAccount?.currency as any) || "ARS",
      });
      handleCancelForm();
      return;
    }

    onAdd({
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description: desc || cat.name,
      category: cat,
      type,
      accountId: selectedAccId,
      frequency: freq,
      startDate: start,
      nextDate: start,
      paused: false,
      currency: (selectedAccount?.currency as any) || "ARS",
    });
    handleCancelForm();
  };

  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-display font-semibold text-foreground">{t("recurring.title")}</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{t("recurring.subtitle")}</p>
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
          <div className="flex justify-center mb-3">
            <div className="flex bg-secondary rounded-full p-0.5">
              <button onClick={() => { setType("expense"); setCatId(""); }}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "expense" ? "bg-card text-foreground" : "text-muted-foreground"}`}>
                {t("quickadd.expense")}
              </button>
              <button onClick={() => { setType("income"); setCatId(""); }}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "income" ? "bg-card text-foreground" : "text-muted-foreground"}`}>
                {t("quickadd.income")}
              </button>
            </div>
          </div>

          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={t("txedit.amount")}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder={t("quickadd.descPlaceholder")}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />

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

          <label className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("quickadd.category")}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {filteredCats.map(cat => (
              <button key={cat.id} onClick={() => setCatId(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-colors ${
                  catId === cat.id ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30" : "bg-secondary/50 text-muted-foreground"
                }`}>
                <div className={`w-4 h-4 rounded-[5px] ${cat.color} flex items-center justify-center`}>
                  <CategoryIcon name={cat.icon || "circle-dot"} className="w-2.5 h-2.5 text-white" />
                </div>
                {cat.name}
              </button>
            ))}
          </div>

          <label className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("quickadd.account")}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {accounts.map(acc => (
              <button key={acc.id} onClick={() => setAccId(acc.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-colors ${
                  accId === acc.id ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30" : "bg-secondary/50 text-muted-foreground"
                }`}>
                <div className={`category-dot ${acc.color}`} />
                {acc.name}
              </button>
            ))}
          </div>

          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("recurring.startDate")}</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none" />

          <button onClick={handleSubmit} disabled={!catId || !parseFloat(amount)}
            className="w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium disabled:opacity-40">
            {t("common.save")}
          </button>
        </motion.div>
      )}

      <div className="px-4 space-y-3">
        {recurringTxs.length === 0 && !showForm && (
          <p className="text-center text-[13px] text-muted-foreground py-8">{t("recurring.noRecurring")}</p>
        )}
        {recurringTxs.map(rtx => (
          <motion.div key={rtx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-[16px] bg-card border border-border/50 ${rtx.paused ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-[8px] ${rtx.category.color} flex items-center justify-center`}>
                  <CategoryIcon name={rtx.category.icon || "circle-dot"} className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <span className="text-[14px] font-medium text-foreground">{rtx.description}</span>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{freqLabel(rtx.frequency)}</span>
                    <span>·</span>
                    <span className={rtx.paused ? "text-amber-500" : "text-primary"}>
                      {rtx.paused ? t("recurring.paused") : t("recurring.active")}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`font-mono-data text-[14px] ${rtx.type === "income" ? "text-primary" : "text-foreground"}`}>
                {formatAmount(rtx.amount, { sign: rtx.type === "income" ? "+" : "-" })}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-muted-foreground">
                {t("recurring.nextDate")}: {format(new Date(rtx.nextDate), "MMM d, yyyy")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStartEdit(rtx)}
                  title={t("common.edit")}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onTogglePause(rtx.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                  {rtx.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                {confirmDeleteId === rtx.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => { onDelete(rtx.id); setConfirmDeleteId(null); }}
                      className="px-2 py-0.5 rounded text-[11px] bg-destructive text-destructive-foreground font-medium transition-colors"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(rtx.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
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
