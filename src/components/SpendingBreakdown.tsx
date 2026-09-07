import { Transaction } from "@/lib/types";
import { motion } from "framer-motion";
import { useSettings, type ChartType } from "@/lib/settings-store";
import { BarChart, Bar, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SpendingBreakdownProps {
  transactions: Transaction[];
  referenceDate?: Date;
}

export function SpendingBreakdown({ transactions, referenceDate = new Date() }: SpendingBreakdownProps) {
  const { formatAmount, t, settings } = useSettings();
  const chartType = settings.chartType;

  const targetMonth = referenceDate.getMonth();
  const targetYear = referenceDate.getFullYear();

  const expenses = transactions.filter(
    t => t.type === "expense" &&
      !t.isCardPayment &&
      !t.isTransfer &&
      t.date.getMonth() === targetMonth &&
      t.date.getFullYear() === targetYear
  );
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  const byCategory = expenses.reduce<Record<string, { name: string; amount: number; color: string }>>((acc, t) => {
    if (!acc[t.category.id]) acc[t.category.id] = { name: t.category.name, amount: 0, color: t.category.color };
    acc[t.category.id].amount += t.amount;
    return acc;
  }, {});

  const sorted = Object.values(byCategory).sort((a, b) => b.amount - a.amount);

  // Map tailwind bg classes to hex for recharts
  const colorMap: Record<string, string> = {
    "bg-emerald-500": "#10b981", "bg-sky-500": "#0ea5e9", "bg-orange-500": "#f97316",
    "bg-red-400": "#f87171", "bg-pink-500": "#ec4899", "bg-violet-500": "#8b5cf6",
    "bg-amber-500": "#f59e0b", "bg-zinc-500": "#71717a", "bg-emerald-400": "#34d399",
    "bg-teal-400": "#2dd4bf", "bg-cyan-400": "#22d3ee", "bg-rose-500": "#f43f5e",
    "bg-indigo-500": "#6366f1", "bg-lime-500": "#84cc16", "bg-fuchsia-500": "#d946ef",
    "bg-yellow-500": "#eab308",
  };

  const chartData = sorted.map(cat => ({
    name: cat.name,
    value: cat.amount,
    fill: colorMap[cat.color] || "#71717a",
  }));

  return (
    <div className="px-4 py-4">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">{t("breakdown.title")}</h2>
      
      {/* Chart */}
      {chartType !== "none" && sorted.length > 0 && (
        <div className="mb-4">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [formatAmount(value), ""]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [formatAmount(value), ""]}
                />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="hsl(142 71% 45%)" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Stacked bar (always shown as legend) */}
      {sorted.length > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden mb-4">
          {sorted.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ width: 0 }}
              animate={{ width: `${(cat.amount / total) * 100}%` }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
              className={`${cat.color} ${i === 0 ? "rounded-l-full" : ""} ${i === sorted.length - 1 ? "rounded-r-full" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {sorted.map(cat => (
          <div key={cat.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`category-dot ${cat.color}`} />
              <span className="text-[13px] text-foreground">{cat.name}</span>
            </div>
            <span className="font-mono-data text-[13px] text-muted-foreground">
              {formatAmount(cat.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
