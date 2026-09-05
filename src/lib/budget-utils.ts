/**
 * Utilidades financieras puras para Presupuestos Inteligentes (Burn Rate, Velocidad y Alertas)
 */

export interface BudgetMetrics {
  spent: number;
  limit: number;
  remaining: number;
  daysInMonth: number;
  currentDay: number;
  daysRemaining: number;
  percentageSpent: number;
  percentageMonthElapsed: number;
  projectedEndMonthSpent: number;
  dailyAllowanceRemaining: number;
  isOverBudget: boolean;
  isPaceWarning: boolean;
  status: "safe" | "warning" | "danger";
}

/**
 * Calcula las métricas temporales y de velocidad de consumo de un presupuesto
 */
export function calculateBudgetMetrics(
  spent: number,
  limit: number,
  referenceDate: Date = new Date()
): BudgetMetrics {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();

  // Total de días del mes
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = Math.max(daysInMonth - currentDay + 1, 1);

  const percentageSpent = limit > 0 ? (spent / limit) * 100 : 0;
  const percentageMonthElapsed = (currentDay / daysInMonth) * 100;

  // Gasto proyectado al ritmo actual diario transcurrido
  const dailyBurnRate = currentDay > 0 ? spent / currentDay : 0;
  const projectedEndMonthSpent = dailyBurnRate * daysInMonth;

  const remaining = Math.max(limit - spent, 0);
  const dailyAllowanceRemaining = remaining / daysRemaining;

  const isOverBudget = spent > limit;
  // Advertencia de velocidad: si el gasto real supera el 75% o si la proyección supera el 100% antes de fin de mes
  const isPaceWarning =
    !isOverBudget &&
    ((projectedEndMonthSpent > limit && percentageMonthElapsed < 85) || percentageSpent >= 75);

  let status: "safe" | "warning" | "danger" = "safe";
  if (isOverBudget) {
    status = "danger";
  } else if (isPaceWarning) {
    status = "warning";
  }

  return {
    spent,
    limit,
    remaining,
    daysInMonth,
    currentDay,
    daysRemaining,
    percentageSpent: Math.min(percentageSpent, 100),
    percentageMonthElapsed,
    projectedEndMonthSpent,
    dailyAllowanceRemaining,
    isOverBudget,
    isPaceWarning,
    status,
  };
}

/**
 * Calcula el gasto promedio mensual de una categoría en los últimos N meses (por defecto 3)
 */
export function calculateSuggestedBudget(
  transactions: { amount: number; type: string; category: { id: string }; date: Date }[],
  categoryId: string,
  monthsCount: number = 3,
  referenceDate: Date = new Date()
): number {
  if (monthsCount <= 0) return 0;

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  let totalExpense = 0;

  for (let i = 1; i <= monthsCount; i++) {
    const target = new Date(currentYear, currentMonth - i, 1);
    const m = target.getMonth();
    const y = target.getFullYear();

    const monthSpent = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category.id === categoryId &&
          t.date.getMonth() === m &&
          t.date.getFullYear() === y
      )
      .reduce((sum, t) => sum + t.amount, 0);

    totalExpense += monthSpent;
  }

  const average = totalExpense / monthsCount;
  // Redondear a números limpios (múltiplos de 100 o 500)
  return Math.round(average / 100) * 100;
}

/**
 * Calcula el remanente (positivo o negativo) de un presupuesto del mes anterior
 */
export function calculateMonthlyRollover(budgetAmount: number, previousMonthSpent: number): number {
  return budgetAmount - previousMonthSpent;
}

/**
 * Calcula el límite efectivo de un presupuesto considerando el rollover si está habilitado
 */
export function calculateEffectiveBudgetAmount(
  baseAmount: number,
  enableRollover: boolean = false,
  accumulatedRollover: number = 0
): { effectiveAmount: number; rolloverAmount: number } {
  if (!enableRollover) {
    return { effectiveAmount: baseAmount, rolloverAmount: 0 };
  }
  const effectiveAmount = Math.max(0, baseAmount + accumulatedRollover);
  return { effectiveAmount, rolloverAmount: accumulatedRollover };
}
