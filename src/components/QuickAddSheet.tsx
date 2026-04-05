import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Delete } from "lucide-react";
import { Category, Account, Tag } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";
import { ResponsiveSheet } from "./ResponsiveSheet";

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description: string, category: Category, type: "income" | "expense", accountId: string, extras?: { tags?: string[]; note?: string; installments?: number }) => void;
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

  const filteredCats = categories.filter(c => c.type === type && !c.archived);

  const handleKey = (key: string) => {
    if (key === "del") {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    } else if (key === ".") {
      if (!amount.includes(".")) setAmount(prev => prev + ".");
    } else {
      setAmount(prev => prev === "0" ? key : prev + key);
    }
  };

  const handleNext = () => {
    if (parseFloat(amount) > 0) setStep("details");
  };

  const handleSubmit = () => {
    if (!selectedCategory) return;
    onSubmit(parseFloat(amount), description || selectedCategory.name, selectedCategory, type, selectedAccount, {});
    resetAndClose();
  };

  const resetAndClose = () => {
    setAmount("0");
    setType("expense");
    setStep("amount");
    setSelectedCategory(null);
    setDescription("");
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
            <div className="px-5 py-6 text-center">
              <div className="flex items-center justify-center gap-1">
                {type === "expense" ? <ArrowUpRight className="w-5 h-5 text-destructive" /> : <ArrowDownLeft className="w-5 h-5 text-primary" />}
                <span className={`font-mono-data text-[40px] tracking-tight ${type === "income" ? "text-primary" : "text-foreground"}`}>
                  {currencySymbol}{amount}
                </span>
              </div>
            </div>
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
            <div className="flex flex-wrap gap-2 mb-6">
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
            <div className="flex gap-3">
              <button onClick={() => setStep("amount")} className="flex-1 h-12 rounded-[12px] bg-secondary text-foreground font-medium text-[15px] active:scale-[0.98] transition-transform">
                {t("quickadd.back")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory}
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
