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
  initialType?: "expense" | "income";
}

export function QuickAddSheet({ open, onClose, onSubmit, accounts, categories, tags = [], initialType = "expense" }: QuickAddSheetProps) {
  const { currencySymbol, t } = useSettings();
  const [amount, setAmount] = useState("0");
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [step, setStep] = useState<"amount" | "details">("amount");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [installments, setInstallments] = useState(1);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Sincronizar con el tipo inicial al abrirse desde el Speed Dial
  useState(() => {
    if (initialType) setType(initialType);
  });

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

  const evaluateExpression = (expr: string): string => {
    try {
      // Sanitizar expresión: permitir solo números, +, - y punto decimal
      const sanitized = expr.replace(/[^0-9+\-.]/g, "");
      if (!sanitized || /[+\-.]$/.test(sanitized)) return expr;
      // Evaluar suma o resta simple sin librerías externas
      const tokens = sanitized.match(/([+-]?[0-9.]+)/g);
      if (!tokens) return expr;
      const total = tokens.reduce((acc, curr) => acc + parseFloat(curr), 0);
      return isNaN(total) ? expr : (Math.round(total * 100) / 100).toString();
    } catch {
      return expr;
    }
  };

  const handleKey = (key: string) => {
    triggerHaptic(8);
    if (key === "del") {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    } else if (key === "=") {
      setAmount(prev => evaluateExpression(prev));
    } else if (key === "+" || key === "-") {
      setAmount(prev => {
        if (prev.endsWith("+") || prev.endsWith("-")) {
          return prev.slice(0, -1) + key;
        }
        return prev + key;
      });
    } else if (key === ".") {
      setAmount(prev => {
        const parts = prev.split(/[+\-]/);
        const lastPart = parts[parts.length - 1];
        if (!lastPart.includes(".")) return prev + ".";
        return prev;
      });
    } else {
      setAmount(prev => prev === "0" ? key : prev + key);
    }
  };

  const handleQuickCategorySubmit = (cat: Category) => {
    const finalAmount = parseFloat(evaluateExpression(amount));
    if (isNaN(finalAmount) || finalAmount <= 0) return;
    triggerHaptic(15);
    onSubmit(finalAmount, cat.name, cat, type, selectedAccount, {});
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

  const keys = [
    "7", "8", "9", "+",
    "4", "5", "6", "-",
    "1", "2", "3", "=",
    ".", "0", "del"
  ];

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
          <motion.div key="amount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Amount display */}
            <div className={`text-center pt-2 pb-3 mb-2 rounded-2xl mx-4 border transition-colors ${
              type === "expense"
                ? "bg-destructive/10 border-destructive/20"
                : "bg-primary/10 border-primary/20"
            }`}>
              <div className="flex items-center justify-center gap-1.5">
                {type === "expense" ? (
                  <ArrowUpRight className="w-6 h-6 text-destructive" />
                ) : (
                  <ArrowDownLeft className="w-6 h-6 text-primary" />
                )}
                <span className={`font-mono-data text-[40px] font-semibold tracking-tight ${type === "expense" ? "text-destructive" : "text-primary"}`}>
                  {type === "expense" ? "-" : "+"}{currencySymbol}{amount}
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground block mt-0.5 uppercase tracking-wider">
                {type === "expense" ? "Salida de dinero" : "Entrada de dinero"}
              </span>
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

            {/* Teclado numérico tipo calculadora con operadores */}
            <div className="grid grid-cols-4 gap-1 px-4 pb-3">
              {keys.map(key => {
                const isOp = key === "+" || key === "-" || key === "=";
                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className={`h-13 rounded-[12px] flex items-center justify-center font-medium active:scale-95 transition-all ${
                      isOp
                        ? "bg-primary/20 text-primary text-[20px] font-semibold hover:bg-primary/30"
                        : "bg-secondary/50 text-foreground text-[19px] hover:bg-secondary/80"
                    } ${key === "del" ? "col-span-2" : ""}`}
                    style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset" }}
                  >
                    {key === "del" ? <Delete className="w-5 h-5" /> : key}
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-6">
              <button
                onClick={handleNext}
                disabled={parseFloat(amount) <= 0 && !/[0-9]/.test(amount)}
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
            <div className="grid grid-cols-4 gap-2.5 mb-5 max-h-48 overflow-y-auto pr-1">
              {filteredCats.map(cat => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                      isSelected
                        ? "bg-secondary ring-2 ring-primary scale-102 shadow-sm"
                        : "bg-secondary/30 hover:bg-secondary/60 active:scale-95"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-full ${cat.color} flex items-center justify-center text-white mb-1.5 shadow-sm`}>
                      <CategoryIcon name={cat.icon || "circle-dot"} className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground text-center truncate w-full px-1">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
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
