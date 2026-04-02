import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Budget, Category } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";
import { Progress } from "@/components/ui/progress";

interface BudgetManagerProps {
  budgets: Budget[];
  categories: Category[];
  getBudgetSpent: (categoryId: string, month: number, year: number) => number;
  getAllActiveCategories: (type?: "income" | "expense") => Category[];
  onAdd: (budget: Budget) => void;
  onUpdate: (id: string, updates: Partial<Budget>) => void;
  onDelete: (id: string) => void;
}

export function BudgetManager({
  budgets, categories, getBudgetSpent, getAllActiveCategories,
  onAdd, onUpdate, onDelete,
}: BudgetManagerProps) {
  const { formatAmount, t } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const currentBudgets = budgets.filter(b => b.month === month && b.year === year);
  const expenseCategories = getAllActiveCategories("expense");

  const handleAdd = () => {
    if (!selectedCat || !parseFloat(limitAmount)) return;
    onAdd({
      id: Date.now().toString(),
      categoryId: selectedCat,
      amount: parseFloat(limitAmount),
      month, year,
    });
    setSelectedCat("");
    setLimitAmount("");
    setShowForm(false);
  };

  const totalBudgeted = currentBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = currentBudgets.reduce((s, b) => s + getBudgetSpent(b.categoryId, month, year), 0);

  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-display font-semibold text-foreground">{t("budget.title")}</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{t("budget.subtitle")}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
          <label className="text-[12px] text-muted-foreground font-medium mb-2 block">{t("budget.category")}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {expenseCategories.filter(c => !currentBudgets.some(b => b.categoryId === c.id)).map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] transition-colors ${
                  selectedCat === cat.id ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30" : "bg-secondary/50 text-muted-foreground"
                }`}>
                <div className={`w-4 h-4 rounded-[5px] ${cat.color} flex items-center justify-center`}>
                  <CategoryIcon name={cat.icon || "circle-dot"} className="w-2.5 h-2.5 text-white" />
                </div>
                {cat.name}
              </button>
            ))}
          </div>
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("budget.limit")}</label>
          <input type="number" value={limitAmount} onChange={e => setLimitAmount(e.target.value)}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <button onClick={handleAdd} disabled={!selectedCat || !parseFloat(limitAmount)}
            className="w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium disabled:opacity-40">
            {t("common.save")}
          </button>
        </motion.div>
      )}

      {/* Summary */}
      {currentBudgets.length > 0 && (
        <div className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
          <div className="flex justify-between text-[13px] mb-2">
            <span className="text-muted-foreground">{t("budget.monthTotal")}</span>
            <span className="text-foreground font-medium">{formatAmount(totalBudgeted)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">{t("budget.monthSpent")}</span>
            <span className={`font-medium ${totalSpent > totalBudgeted ? "text-destructive" : "text-foreground"}`}>
              {formatAmount(totalSpent)}
            </span>
          </div>
        </div>
      )}

      {/* Budget items */}
      <div className="px-4 space-y-3">
        {currentBudgets.length === 0 && !showForm && (
          <p className="text-center text-[13px] text-muted-foreground py-8">{t("budget.noBudgets")}</p>
        )}
        {currentBudgets.map(budget => {
          const cat = categories.find(c => c.id === budget.categoryId);
          if (!cat) return null;
          const spent = getBudgetSpent(budget.categoryId, month, year);
          const pct = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;
          const isWarning = pct >= 80 && !isOver;

          return (
            <motion.div key={budget.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-[16px] bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-[8px] ${cat.color} flex items-center justify-center`}>
                    <CategoryIcon name={cat.icon || "circle-dot"} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[14px] font-medium text-foreground">{cat.name}</span>
                </div>
                <button onClick={() => onDelete(budget.id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Progress value={pct} className="h-2 mb-2" />
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">
                  {t("budget.spent")}: {formatAmount(spent)}
                </span>
                <span className={isOver ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {isOver
                    ? `${t("budget.over")} ${formatAmount(spent - budget.amount)}`
                    : `${t("budget.remaining")}: ${formatAmount(budget.amount - spent)}`
                  }
                </span>
              </div>
              {isWarning && (
                <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-500">
                  <AlertTriangle className="w-3 h-3" />
                  {t("budget.alert80")}
                </div>
              )}
              {isOver && (
                <div className="flex items-center gap-1 mt-2 text-[11px] text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  {t("budget.alert100")}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Mini budget widget for dashboard
export function BudgetSummaryWidget({
  budgets, categories, getBudgetSpent,
}: {
  budgets: Budget[]; categories: Category[];
  getBudgetSpent: (categoryId: string, month: number, year: number) => number;
}) {
  const { formatAmount, t } = useSettings();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const current = budgets.filter(b => b.month === month && b.year === year);

  if (current.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">{t("dash.budgetSummary")}</h2>
      <div className="space-y-2">
        {current.slice(0, 3).map(b => {
          const cat = categories.find(c => c.id === b.categoryId);
          if (!cat) return null;
          const spent = getBudgetSpent(b.categoryId, month, year);
          const pct = Math.min((spent / b.amount) * 100, 100);
          return (
            <div key={b.id} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-[6px] ${cat.color} flex items-center justify-center flex-shrink-0`}>
                <CategoryIcon name={cat.icon || "circle-dot"} className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[12px] mb-0.5">
                  <span className="text-foreground truncate">{cat.name}</span>
                  <span className="text-muted-foreground">{formatAmount(spent)} / {formatAmount(b.amount)}</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
