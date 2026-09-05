import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Delete, Paperclip, Loader2, FileText, X } from "lucide-react";
import { Category, Account, Tag } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { uploadReceipt } from "@/services/storage.service";

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    amount: number,
    description: string,
    category: Category,
    type: "income" | "expense",
    accountId: string,
    extras?: { tags?: string[]; note?: string; installments?: number; receiptUrl?: string }
  ) => void;
  accounts: Account[];
  categories: Category[];
  tags?: Tag[];
}

export function QuickAddSheet({ open, onClose, onSubmit, accounts, categories, tags = [] }: QuickAddSheetProps) {
  const { currencySymbol, t } = useSettings();
  const [amount, setAmount] = useState("0");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [step, setStep] = useState<"amount" | "details">("amount");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [installments, setInstallments] = useState(1);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const selectedAccObj = accounts.find(a => a.id === selectedAccount);
  const isCreditCard = selectedAccObj?.type === "credit";

  const filteredCats = categories.filter(c => c.type === type && !c.archived);

  // Smart chips: las 4 categorías más populares para selección instantánea
  const topCategories = filteredCats.slice(0, 4);

  const triggerHaptic = (duration = 10) => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(duration);
      }
    } catch {}
  };

  const handleKey = (key: string) => {
    triggerHaptic(8);
    if (key === "del") {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    } else if (key === ".") {
      if (!amount.includes(".")) setAmount(prev => prev + ".");
    } else {
      setAmount(prev => prev === "0" ? key : prev + key);
    }
  };

  const handleQuickCategorySubmit = (cat: Category) => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    triggerHaptic(15);
    onSubmit(val, cat.name, cat, type, selectedAccount, {});
    resetAndClose();
  };

  const handleNext = () => {
    triggerHaptic(12);
    if (parseFloat(amount) > 0) setStep("details");
  };

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

  const handleSubmit = () => {
    if (!selectedCategory) return;
    const extras: { installments?: number; receiptUrl?: string } = {};
    if (type === "expense" && installments > 1) {
      extras.installments = installments;
    }
    if (receiptUrl) {
      extras.receiptUrl = receiptUrl;
    }
    triggerHaptic(25);
    onSubmit(parseFloat(amount), description || selectedCategory.name, selectedCategory, type, selectedAccount, extras);
    resetAndClose();
  };

  const resetAndClose = () => {
    setAmount("0");
    setType("expense");
    setStep("amount");
    setSelectedCategory(null);
    setDescription("");
    setInstallments(1);
    setReceiptUrl(undefined);
    setUploadingReceipt(false);
    onClose();
  };

  const keys = ["1","2","3","4","5","6","7","8","9",".","0","del"];

  const typeToggle = (
    <div className="flex bg-secondary rounded-full p-0.5">
      <button
        onClick={() => setType("expense")}
        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "expense" ? "bg-card text-foreground" : "text-muted-foreground"}`}
      >
        {t("quickadd.expense")}
      </button>
      <button
        onClick={() => setType("income")}
        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "income" ? "bg-card text-foreground" : "text-muted-foreground"}`}
      >
        {t("quickadd.income")}
      </button>
    </div>
  );

  return (
    <ResponsiveSheet open={open} onClose={resetAndClose} title={typeToggle}>
      <AnimatePresence mode="wait">
        {step === "amount" ? (
          <motion.div key="amount" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="px-5 py-5 text-center">
              <div className="flex items-center justify-center gap-1">
                {type === "expense" ? <ArrowUpRight className="w-5 h-5 text-destructive" /> : <ArrowDownLeft className="w-5 h-5 text-primary" />}
                <span className={`font-mono-data text-[40px] tracking-tight ${type === "income" ? "text-primary" : "text-foreground"}`}>
                  {currencySymbol}{amount}
                </span>
              </div>
            </div>

            {/* Smart Chips: Guardado en 1 toque para categorías frecuentes */}
            {parseFloat(amount) > 0 && topCategories.length > 0 && (
              <div className="px-4 pb-3 flex items-center justify-center gap-1.5 overflow-x-auto">
                {topCategories.map(cat => (
                  <button
                    key={`quick-${cat.id}`}
                    onClick={() => handleQuickCategorySubmit(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary text-foreground text-xs font-medium border border-border/40 active:scale-95 transition-all shadow-sm"
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${cat.color} flex items-center justify-center`}>
                      <CategoryIcon name={cat.icon || "circle-dot"} className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-1 px-4 pb-3">
              {keys.map(key => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className="h-14 rounded-[12px] bg-secondary/50 flex items-center justify-center text-foreground text-[20px] font-medium active:bg-secondary hover:bg-secondary/80 transition-colors"
                  style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset" }}
                >
                  {key === "del" ? <Delete className="w-5 h-5" /> : key}
                </button>
              ))}
            </div>
            <div className="px-4 pb-6">
              <button
                onClick={handleNext}
                disabled={parseFloat(amount) <= 0}
                className="w-full h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] disabled:opacity-40 transition-opacity active:scale-[0.98]"
              >
                {t("quickadd.next")}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-4 pb-6">
            <div className="text-center py-3">
              <span className={`font-mono-data text-[28px] ${type === "income" ? "text-primary" : "text-foreground"}`}>
                {type === "expense" ? "-" : "+"}{currencySymbol}{amount}
              </span>
            </div>
            <input
              type="text"
              placeholder={t("quickadd.descPlaceholder")}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
            />
            <span className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("quickadd.category")}</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {filteredCats.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                    selectedCategory?.id === cat.id
                      ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                  }`}
                >
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
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                    selectedAccount === acc.id
                      ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70"
                  }`}
                >
                  <div className={`category-dot ${acc.color}`} />
                  {acc.name}
                </button>
              ))}
            </div>
            {isCreditCard && type === "expense" && (
              <div className="mb-4 bg-secondary/30 p-3 rounded-[12px] border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-muted-foreground font-medium">{t("quickadd.installmentsCount")}</span>
                  {installments > 1 && (
                    <span className="text-[11px] font-mono-data text-muted-foreground">
                      {installments}x {currencySymbol}{(parseFloat(amount) / installments).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 6, 9, 12, 18, 24].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallments(n)}
                      className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                        installments === n
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {n === 1 ? "1 pago" : `${n} cuotas`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Receipt Upload & Preview in QuickAdd */}
            <div className="mb-6 p-3 rounded-[12px] bg-secondary/30 border border-border/40">
              <span className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("quickadd.receipt")}</span>
              {receiptUrl ? (
                <div className="flex items-center justify-between gap-3 bg-background/80 p-2.5 rounded-[8px] border border-border/60">
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary underline truncate">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t("quickadd.viewReceipt")}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setReceiptUrl(undefined)}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-[8px] border border-dashed border-border hover:border-primary/50 text-xs text-muted-foreground cursor-pointer transition-colors">
                  {uploadingReceipt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>{t("quickadd.uploadingReceipt")}</span>
                    </>
                  ) : (
                    <>
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span>{t("quickadd.attachReceipt")}</span>
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

            <div className="flex gap-3">
              <button onClick={() => setStep("amount")} className="flex-1 h-12 rounded-[12px] bg-secondary text-foreground font-medium text-[15px] active:scale-[0.98] transition-transform">
                {t("quickadd.back")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory || uploadingReceipt}
                className="flex-[2] h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {t("quickadd.save")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ResponsiveSheet>
  );
}
