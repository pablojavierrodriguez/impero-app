import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2, Save, Copy, Paperclip, FileText, Check, Loader2, X } from "lucide-react";
import { Transaction, Category, Account, Tag } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { format } from "date-fns";
import { useSettings } from "@/lib/settings-store";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { uploadReceipt } from "@/services/storage.service";

interface TransactionEditSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  onDelete: (id: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onDuplicate?: (tx: Transaction) => void;
  accounts: Account[];
  categories: Category[];
  tags?: Tag[];
}

export function TransactionEditSheet({
  transaction, open, onClose, onUpdate, onDelete, onDeleteGroup, onDuplicate, accounts, categories, tags = [],
}: TransactionEditSheetProps) {
  const { t } = useSettings();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [date, setDate] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setType(transaction.type);
      setSelectedCategory(transaction.category);
      setSelectedAccount(transaction.accountId);
      setDate(format(transaction.date, "yyyy-MM-dd'T'HH:mm"));
      setReceiptUrl(transaction.receiptUrl);
      setConfirmDelete(false);
    }
  }, [transaction]);

  const filteredCats = categories.filter(c => c.type === type && !c.archived);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingReceipt(true);
      const url = await uploadReceipt(file);
      setReceiptUrl(url);
    } catch (err) {
      console.error("Error al subir comprobante:", err);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSave = () => {
    if (!transaction || !selectedCategory || !parseFloat(amount)) return;
    onUpdate(transaction.id, {
      amount: parseFloat(amount),
      description, type,
      category: selectedCategory,
      accountId: selectedAccount,
      date: new Date(date),
      receiptUrl,
    });
    onClose();
  };

  const handleDeleteSingle = () => {
    if (!transaction) return;
    onDelete(transaction.id);
    onClose();
  };

  const handleDeletePlan = () => {
    if (!transaction || !transaction.installmentInfo?.groupId) return;
    if (onDeleteGroup) {
      onDeleteGroup(transaction.installmentInfo.groupId);
    } else {
      onDelete(transaction.id);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!transaction) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    handleDeleteSingle();
  };

  const isInstallment = !!transaction?.installmentInfo?.groupId;

  const titleRight = (
    <div className="flex gap-1">
      {onDuplicate && (
        <button onClick={() => { if (transaction) { onDuplicate(transaction); onClose(); }}}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Copy className="w-5 h-5" />
        </button>
      )}
      <button onClick={handleDelete}
        className={`p-2 transition-colors ${confirmDelete ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}>
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <ResponsiveSheet open={open} onClose={onClose} title={t("txedit.title")} titleRight={titleRight}>
      {transaction && (
        <div className="px-4 pb-6">
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-3 rounded-[12px] bg-destructive/10 border border-destructive/20"
            >
              <p className="text-[13px] text-destructive font-medium mb-2">{t("txedit.deleteConfirm")}</p>
              {isInstallment ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDeleteSingle}
                    className="w-full h-9 rounded-[8px] bg-destructive/20 text-destructive text-[13px] font-medium hover:bg-destructive/30 transition-colors"
                  >
                    {t("txedit.deleteInstallmentOnly")} ({transaction.installmentInfo?.current}/{transaction.installmentInfo?.total})
                  </button>
                  <button
                    onClick={handleDeletePlan}
                    className="w-full h-9 rounded-[8px] bg-destructive text-destructive-foreground text-[13px] font-medium active:scale-[0.98] transition-transform"
                  >
                    {t("txedit.deleteInstallmentPlan")}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="w-full h-8 rounded-[8px] bg-secondary text-foreground text-[12px] font-medium mt-1"
                  >
                    {t("txedit.cancel")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 h-9 rounded-[8px] bg-secondary text-foreground text-[13px] font-medium">
                    {t("txedit.cancel")}
                  </button>
                  <button onClick={handleDeleteSingle} className="flex-1 h-9 rounded-[8px] bg-destructive text-destructive-foreground text-[13px] font-medium">
                    {t("txedit.confirm")}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex justify-center mb-4">
            <div className="flex bg-secondary rounded-full p-0.5">
              <button
                onClick={() => { setType("expense"); setSelectedCategory(null); }}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "expense" ? "bg-card text-foreground" : "text-muted-foreground"}`}
              >
                {t("quickadd.expense")}
              </button>
              <button
                onClick={() => { setType("income"); setSelectedCategory(null); }}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "income" ? "bg-card text-foreground" : "text-muted-foreground"}`}
              >
                {t("quickadd.income")}
              </button>
            </div>
          </div>

          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("txedit.amount")}</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground font-mono-data text-[20px] text-center placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4" />

          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("txedit.description")}</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4" />

          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("txedit.dateTime")}</label>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
            className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] focus:border-muted-foreground outline-none transition-colors mb-4" />

          <span className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("quickadd.category")}</span>
          <div className="flex flex-wrap gap-2 mb-4">
            {filteredCats.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                  selectedCategory?.id === cat.id ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30" : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                }`}>
                <div className={`w-5 h-5 rounded-[6px] ${cat.color} flex items-center justify-center`}>
                  <CategoryIcon name={cat.icon || "circle-dot"} className="w-3 h-3 text-white" />
                </div>
                {cat.name}
              </button>
            ))}
          </div>

          <span className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("quickadd.account")}</span>
          <div className="flex flex-wrap gap-2 mb-4">
            {accounts.map(acc => (
              <button key={acc.id} onClick={() => setSelectedAccount(acc.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                  selectedAccount === acc.id ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30" : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                }`}>
                <div className={`category-dot ${acc.color}`} />
                {acc.name}
              </button>
            ))}
          </div>

          {/* Receipt Upload & Preview */}
          <div className="mb-6 p-3 rounded-[12px] bg-secondary/30 border border-border/40">
            <span className="text-[12px] text-muted-foreground font-medium mb-2 block">Comprobante / Recibo</span>
            {receiptUrl ? (
              <div className="flex items-center justify-between gap-3 bg-background/80 p-2.5 rounded-[8px] border border-border/60">
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary underline truncate">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">Ver comprobante adjunto</span>
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptUrl(undefined)}
                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-[8px] border border-dashed border-border hover:border-primary/50 text-xs text-muted-foreground cursor-pointer transition-colors">
                {uploadingReceipt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Subiendo archivo...</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span>Adjuntar ticket o foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingReceipt}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <button onClick={handleSave} disabled={!selectedCategory || !parseFloat(amount)}
            className="w-full h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {t("txedit.saveChanges")}
          </button>
        </div>
      )}
    </ResponsiveSheet>
  );
}
