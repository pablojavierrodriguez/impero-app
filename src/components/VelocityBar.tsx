import { motion } from "framer-motion";
import { useSettings } from "@/lib/settings-store";

interface VelocityBarProps {
  spent: number;
  budget: number;
  weekSpent?: number;
}

export function VelocityBar({ spent, budget, weekSpent }: VelocityBarProps) {
  const { formatAmount, t } = useSettings();
  const pct = Math.min((spent / budget) * 100, 100);
  const isOver = spent > budget;

  return (
    <div className="w-full px-4 pt-2 pb-1">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground font-display">{t("velocity.title")}</span>
          {typeof weekSpent === "number" && (
            <span className="text-[10px] text-muted-foreground/70 font-mono-data">
              · Semana: {formatAmount(weekSpent)}
            </span>
          )}
        </div>
        <span className="font-mono-data text-[11px] font-semibold text-foreground">
          {formatAmount(spent)} <span className="text-muted-foreground font-normal">/ {formatAmount(budget)}</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-secondary/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`h-full rounded-full ${isOver ? "bg-destructive" : ""}`}
          style={!isOver ? { background: "linear-gradient(90deg, hsl(142 71% 45%), hsl(142 71% 55%))" } : undefined}
        />
      </div>
    </div>
  );
}
