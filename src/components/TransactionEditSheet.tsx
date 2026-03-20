import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Save } from "lucide-react";
import { Transaction, Category, Account } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { format } from "date-fns";

interface TransactionEditSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  onDelete: (id: string) => void;
  accounts: Account[];
  categories: Category[];
}

export function TransactionEditSheet({
  transaction,
  open,
  onClose,
  onUpdate,
  onDelete,
  accounts,
  categories,
}: TransactionEditSheetProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [date, setDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setType(transaction.type);
      setSelectedCategory(transaction.category);
      setSelectedAccount(transaction.accountId);
      setDate(format(transaction.date, "yyyy-MM-dd'T'HH:mm"));
      setConfirmDelete(false);
    }
  }, [transaction]);

  const filteredCats = categories.filter(c => c.type === type && !c.archived);

  const handleSave = () => {
    if (!transaction || !selectedCategory || !parseFloat(amount)) return;
    onUpdate(transaction.id, {
      amount: parseFloat(amount),
      description,
      type,
      category: selectedCategory,
      accountId: selectedAccount,
      date: new Date(date),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!transaction) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(transaction.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && transaction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
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
              <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
              <span className="text-[15px] font-display font-semibold text-foreground">Edit Transaction</span>
              <button
                onClick={handleDelete}
                className={`p-2 -mr-2 transition-colors ${confirmDelete ? "text-destructive" : "text-muted-foreground"}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mx-4 mb-3 p-3 rounded-[12px] bg-destructive/10 border border-destructive/20"
              >
                <p className="text-[13px] text-destructive font-medium">
                  ¿Eliminar esta transacción? El balance de la cuenta se ajustará.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-9 rounded-[8px] bg-secondary text-foreground text-[13px] font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 h-9 rounded-[8px] bg-destructive text-destructive-foreground text-[13px] font-medium"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            )}

            <div className="px-4 pb-6">
              {/* Type toggle */}
              <div className="flex justify-center mb-4">
                <div className="flex bg-secondary rounded-full p-0.5">
                  <button
                    onClick={() => { setType("expense"); setSelectedCategory(null); }}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "expense" ? "bg-card text-foreground" : "text-muted-foreground"}`}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => { setType("income"); setSelectedCategory(null); }}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${type === "income" ? "bg-card text-foreground" : "text-muted-foreground"}`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount */}
              <label className="text-[12px] text-muted-foreground font-medium mb-1 block">Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground font-mono-data text-[20px] text-center placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
              />

              {/* Description */}
              <label className="text-[12px] text-muted-foreground font-medium mb-1 block">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
              />

              {/* Date */}
              <label className="text-[12px] text-muted-foreground font-medium mb-1 block">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full h-12 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] focus:border-muted-foreground outline-none transition-colors mb-4"
              />

              {/* Category */}
              <span className="text-[12px] text-muted-foreground font-medium mb-2 block">Category</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {filteredCats.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                      selectedCategory?.id === cat.id
                        ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                        : "bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-[6px] ${cat.color} flex items-center justify-center`}>
                      <CategoryIcon name={cat.icon || "circle-dot"} className="w-3 h-3 text-white" />
                    </div>
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

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!selectedCategory || !parseFloat(amount)}
                className="w-full h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
