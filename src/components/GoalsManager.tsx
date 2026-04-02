import { useState } from "react";
import { Plus, Trash2, ArrowDown, ArrowUp, Target, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Goal } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/types";

interface GoalsManagerProps {
  goals: Goal[];
  onAdd: (goal: Goal) => void;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onDelete: (id: string) => void;
  onContribute: (id: string, amount: number) => void;
  onWithdraw: (id: string, amount: number) => void;
}

export function GoalsManager({ goals, onAdd, onUpdate, onDelete, onContribute, onWithdraw }: GoalsManagerProps) {
  const { formatAmount, t } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [actionGoalId, setActionGoalId] = useState<string | null>(null);
  const [actionAmount, setActionAmount] = useState("");

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  const handleAdd = () => {
    if (!name || !parseFloat(target)) return;
    onAdd({
      id: Date.now().toString(), name, targetAmount: parseFloat(target),
      currentAmount: 0, deadline: deadline ? new Date(deadline) : undefined,
      color, icon, completed: false, createdAt: new Date(),
    });
    setName(""); setTarget(""); setDeadline(""); setShowForm(false);
  };

  const displayGoals = tab === "active" ? activeGoals : completedGoals;

  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-display font-semibold text-foreground">{t("goal.title")}</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{t("goal.subtitle")}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-secondary rounded-full p-0.5">
          <button onClick={() => setTab("active")}
            className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab === "active" ? "bg-card text-foreground" : "text-muted-foreground"}`}>
            {t("goal.active")} ({activeGoals.length})
          </button>
          <button onClick={() => setTab("completed")}
            className={`flex-1 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab === "completed" ? "bg-card text-foreground" : "text-muted-foreground"}`}>
            {t("goal.completedTab")} ({completedGoals.length})
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("goal.name")}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t("goal.namePlaceholder")}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("goal.target")}</label>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("goal.deadline")}</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("acct.color")}</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORY_COLORS.slice(0, 8).map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full ${c} ${color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} />
            ))}
          </div>
          <button onClick={handleAdd} disabled={!name || !parseFloat(target)}
            className="w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium disabled:opacity-40">
            {t("common.save")}
          </button>
        </motion.div>
      )}

      <div className="px-4 space-y-3">
        {displayGoals.length === 0 && (
          <p className="text-center text-[13px] text-muted-foreground py-8">{t("goal.noGoals")}</p>
        )}
        {displayGoals.map(goal => {
          const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-[16px] bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-[10px] ${goal.color} flex items-center justify-center`}>
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-foreground">{goal.name}</span>
                    {goal.completed && (
                      <div className="flex items-center gap-1 text-[11px] text-primary">
                        <Check className="w-3 h-3" /> {t("goal.completed")}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => onDelete(goal.id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Progress value={pct} className="h-2 mb-2" />
              <div className="flex justify-between text-[12px] mb-3">
                <span className="text-muted-foreground">
                  {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
                </span>
                <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
              </div>

              {!goal.completed && (
                <>
                  {actionGoalId === goal.id ? (
                    <div className="flex gap-2">
                      <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)}
                        placeholder={t("goal.amount")}
                        className="flex-1 h-9 px-3 rounded-[8px] bg-input border border-border text-foreground text-[13px] focus:outline-none" />
                      <button onClick={() => { if (parseFloat(actionAmount) > 0) { onContribute(goal.id, parseFloat(actionAmount)); setActionGoalId(null); setActionAmount(""); }}}
                        className="h-9 px-3 rounded-[8px] bg-primary text-primary-foreground text-[12px] font-medium">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (parseFloat(actionAmount) > 0) { onWithdraw(goal.id, parseFloat(actionAmount)); setActionGoalId(null); setActionAmount(""); }}}
                        className="h-9 px-3 rounded-[8px] bg-secondary text-foreground text-[12px] font-medium">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setActionGoalId(goal.id)}
                        className="flex-1 h-9 rounded-[8px] bg-primary/10 text-primary text-[12px] font-medium hover:bg-primary/20 transition-colors">
                        {t("goal.contribute")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Dashboard widget
export function GoalsSummaryWidget({ goals }: { goals: Goal[] }) {
  const { formatAmount, t } = useSettings();
  const active = goals.filter(g => !g.completed);
  if (active.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">{t("dash.goalsSummary")}</h2>
      <div className="space-y-2">
        {active.slice(0, 3).map(g => {
          const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
          return (
            <div key={g.id} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-[6px] ${g.color} flex items-center justify-center flex-shrink-0`}>
                <Target className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[12px] mb-0.5">
                  <span className="text-foreground truncate">{g.name}</span>
                  <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
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
