import { useSettings } from "@/lib/settings-store";
import { Transaction } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface ReportsPageProps {
  transactions: Transaction[];
  monthlyExpenses: number;
  monthlyIncome: number;
  getMonthlyTrend: () => { month: string; income: number; expenses: number }[];
  getLastMonthExpenses: () => number;
}

export function ReportsPage({
  transactions, monthlyExpenses, monthlyIncome, getMonthlyTrend, getLastMonthExpenses,
}: ReportsPageProps) {
  const { formatAmount, t } = useSettings();
  const trend = getMonthlyTrend();
  const lastMonthExp = getLastMonthExpenses();
  const delta = lastMonthExp > 0 ? ((monthlyExpenses - lastMonthExp) / lastMonthExp * 100) : 0;

  // Top categories this month
  const now = new Date();
  const monthExpenses = transactions.filter(t =>
    t.type === "expense" && !t.isCardPayment && !t.isTransfer &&
    t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear()
  );
  const byCat = monthExpenses.reduce<Record<string, { name: string; amount: number; color: string }>>((acc, tx) => {
    if (!acc[tx.category.id]) acc[tx.category.id] = { name: tx.category.name, amount: 0, color: tx.category.color };
    acc[tx.category.id].amount += tx.amount;
    return acc;
  }, {});
  const topCats = Object.values(byCat).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const totalExpMonth = monthExpenses.reduce((s, t) => s + t.amount, 0);

  const colorMap: Record<string, string> = {
    "bg-emerald-500": "#10b981", "bg-sky-500": "#0ea5e9", "bg-orange-500": "#f97316",
    "bg-red-400": "#f87171", "bg-pink-500": "#ec4899", "bg-violet-500": "#8b5cf6",
    "bg-amber-500": "#f59e0b", "bg-zinc-500": "#71717a",
  };

  const chartData = trend.map(m => ({
    ...m,
    balance: m.income - m.expenses,
  }));

  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3">
        <h1 className="text-[20px] font-display font-semibold text-foreground">{t("report.title")}</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">{t("report.subtitle")}</p>
      </div>

      {/* Month summary */}
      <div className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
        <h3 className="text-[13px] font-medium text-foreground mb-3">{t("report.monthSummary")}</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground">{t("report.income")}</span>
            <p className="font-mono-data text-[16px] text-primary">{formatAmount(monthlyIncome)}</p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">{t("report.expenses")}</span>
            <p className="font-mono-data text-[16px] text-foreground">{formatAmount(monthlyExpenses)}</p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">{t("report.balance")}</span>
            <p className={`font-mono-data text-[16px] ${monthlyIncome - monthlyExpenses >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatAmount(monthlyIncome - monthlyExpenses, { sign: monthlyIncome - monthlyExpenses >= 0 ? "+" : "-" })}
            </p>
          </div>
        </div>
        {lastMonthExp > 0 && (
          <div className="mt-3 flex items-center gap-1 text-[12px]">
            {delta > 0 ? <TrendingUp className="w-3.5 h-3.5 text-destructive" /> : <TrendingDown className="w-3.5 h-3.5 text-primary" />}
            <span className={delta > 0 ? "text-destructive" : "text-primary"}>
              {Math.abs(delta).toFixed(1)}% {delta > 0 ? t("report.moreSpent") : t("report.lessSpent")}
            </span>
          </div>
        )}
      </div>

      {/* Trend chart */}
      <div className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
        <h3 className="text-[13px] font-medium text-foreground mb-3">{t("report.trend")} · {t("report.months6")}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [formatAmount(value), ""]}
            />
            <Bar dataKey="income" fill="hsl(142 71% 45%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(0 84% 60%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cash flow */}
      <div className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
        <h3 className="text-[13px] font-medium text-foreground mb-3">{t("report.cashFlow")}</h3>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [formatAmount(value), ""]}
            />
            <Line type="monotone" dataKey="balance" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top categories */}
      <div className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
        <h3 className="text-[13px] font-medium text-foreground mb-3">{t("report.topCategories")}</h3>
        {topCats.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">{t("common.noData")}</p>
        ) : (
          <div className="space-y-3">
            {topCats.map((cat, i) => {
              const pct = totalExpMonth > 0 ? (cat.amount / totalExpMonth * 100) : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-[13px] mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px] w-4">{i + 1}</span>
                      <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                      <span className="text-foreground">{cat.name}</span>
                    </div>
                    <span className="font-mono-data text-muted-foreground">{formatAmount(cat.amount)}</span>
                  </div>
                  <div className="ml-6 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
