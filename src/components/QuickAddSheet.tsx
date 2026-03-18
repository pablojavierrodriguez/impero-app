import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownLeft, ArrowUpRight, Delete } from "lucide-react";
import { CATEGORIES, Category, Account } from "@/lib/types";

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description: string, category: Category, type: "income" | "expense", accountId: string) => void;
  accounts: Account[];
}

export function QuickAddSheet({ open, onClose, onSubmit, accounts }: QuickAddSheetProps) {
  const [amount, setAmount] = useState("0");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [step, setStep] = useState<"amount" | "details">("amount");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const [description, setDescription] = useState("");

  const categories = CATEGORIES.filter(c => c.type === type);

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
    onSubmit(parseFloat(amount), description || selectedCategory.name, selectedCategory, type, selectedAccount);
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            onClick={e => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[24px] max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <button onClick={resetAndClose} className="p-2 -ml-2 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
              <div className="flex bg-secondary rounded-full p-0.5">
                <button
                  onClick={() => setType("expense")}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "expense" ? "bg-card text-foreground" : "text-muted-foreground"}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setType("income")}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "income" ? "bg-card text-foreground" : "text-muted-foreground"}`}
                >
                  Income
                </button>
              </div>
              <div className="w-9" />
            </div>

            <AnimatePresence mode="wait">
              {step === "amount" ? (
                <motion.div
                  key="amount"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Amount Display */}
                  <div className="px-5 py-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {type === "expense" ? (
                        <ArrowUpRight className="w-5 h-5 text-destructive" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-primary" />
                      )}
                      <span className={`font-mono-data text-[40px] tracking-tight ${type === "income" ? "text-primary" : "text-foreground"}`}>
                        ${amount}
                      </span>
                    </div>
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-1 px-4 pb-3">
                    {keys.map(key => (
                      <button
                        key={key}
                        onClick={() => handleKey(key)}
                        className="h-14 rounded-[12px] bg-secondary/50 flex items-center justify-center text-foreground text-[20px] font-medium active:bg-secondary transition-colors"
                        style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset" }}
                      >
                        {key === "del" ? <Delete className="w-5 h-5" /> : key}
                      </button>
                    ))}
                  </div>

                  {/* Next button */}
                  <div className="px-4 pb-6">
                    <button
                      onClick={handleNext}
                      disabled={parseFloat(amount) <= 0}
                      className="w-full h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] disabled:opacity-40 transition-opacity active:scale-[0.98]"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-4 pb-6"
                >
                  {/* Amount summary */}
                  <div className="text-center py-3">
                    <span className={`font-mono-data text-[28px] ${type === "income" ? "text-primary" : "text-foreground"}`}>
                      {type === "expense" ? "-" : "+"}${amount}
                    </span>
                  </div>

                  {/* Description */}
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
                  />

                  {/* Category */}
                  <span className="text-[12px] text-muted-foreground font-medium mb-2 block">Category</span>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                          selectedCategory?.id === cat.id
                            ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                            : "bg-secondary/50 text-muted-foreground"
                        }`}
                      >
                        <div className={`category-dot ${cat.color}`} />
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Account */}
                  <span className="text-[12px] text-muted-foreground font-medium mb-2 block">Account</span>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {accounts.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                          selectedAccount === acc.id
                            ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                            : "bg-secondary/50 text-muted-foreground"
                        }`}
                      >
                        <div className={`category-dot ${acc.color}`} />
                        {acc.name}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("amount")}
                      className="flex-1 h-12 rounded-[12px] bg-secondary text-foreground font-medium text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedCategory}
                      className="flex-[2] h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
