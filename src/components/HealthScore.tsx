import { motion } from "framer-motion";
import { Shield, TrendingUp, TrendingDown } from "lucide-react";
import { useSettings } from "@/lib/settings-store";

interface HealthScoreProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  budgetsUsedPct: number; // 0-100 average budget usage
  goalsProgress: number; // 0-100 average goal progress
  pendingBills: number;
}

export function HealthScore({ monthlyIncome, monthlyExpenses, budgetsUsedPct, goalsProgress, pendingBills }: HealthScoreProps) {
  const { t } = useSettings();

  // Calculate score 0-100
  let score = 50;
  // Savings ratio bonus (up to +25)
  if (monthlyIncome > 0) {
    const savingsRatio = (monthlyIncome - monthlyExpenses) / monthlyIncome;
    score += Math.min(25, Math.max(-25, savingsRatio * 50));
  }
  // Budget discipline (up to +15)
  score += budgetsUsedPct <= 80 ? 15 : budgetsUsedPct <= 100 ? 5 : -10;
  // Goals progress (up to +10)
  score += (goalsProgress / 100) * 10;
  // Pending bills penalty
  score -= pendingBills * 3;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const getColor = () => {
    if (score >= 75) return "text-primary";
    if (score >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  const getLabel = () => {
    if (score >= 75) return "💪";
    if (score >= 50) return "👍";
    return "⚠️";
  };

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="px-4 py-3">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">{t("dash.healthScore")}</h2>
      <div className="card-surface">
        <div className="card-inner flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
              <motion.circle
                cx="40" cy="40" r="36" fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={getColor()}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-mono-data text-lg font-bold ${getColor()}`}>{score}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-foreground mb-1">
              {getLabel()} {score >= 75 ? (t("dash.healthScore")) : score >= 50 ? "OK" : "⚠️"}
            </div>
            <div className="space-y-1">
              {monthlyIncome > monthlyExpenses ? (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <TrendingUp className="w-3 h-3" />
                  <span>{t("health.savingsRate").replace("{rate}", String(Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)))}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <TrendingDown className="w-3 h-3" />
                  <span>{t("health.spendingMore")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
