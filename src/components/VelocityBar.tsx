import { motion } from "framer-motion";

interface VelocityBarProps {
  spent: number;
  budget: number;
}

export function VelocityBar({ spent, budget }: VelocityBarProps) {
  const pct = Math.min((spent / budget) * 100, 100);
  const isOver = spent > budget;

  return (
    <div className="w-full px-4 pt-2 pb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">Daily Velocity</span>
        <span className="font-mono-data text-[11px] text-muted-foreground">
          ${spent.toFixed(0)} / ${budget.toFixed(0)}
        </span>
      </div>
      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
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
