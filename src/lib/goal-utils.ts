/**
 * Cálculos financieros y proyecciones para Metas de Ahorro y Fondos de Emergencia (SPEC-006)
 */

export interface GoalPaceMetrics {
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  hasDeadline: boolean;
  monthsRemaining?: number;
  recommendedMonthlyContribution?: number;
  isCompleted: boolean;
}

/**
 * Calcula las métricas de progreso y la cuota de ahorro mensual sugerida
 */
export function calculateGoalPace(
  currentAmount: number,
  targetAmount: number,
  deadline?: Date,
  referenceDate: Date = new Date()
): GoalPaceMetrics {
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const percentage = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
  const isCompleted = currentAmount >= targetAmount && targetAmount > 0;

  if (!deadline) {
    return {
      targetAmount,
      currentAmount,
      remainingAmount,
      percentage,
      hasDeadline: false,
      isCompleted,
    };
  }

  // Calcular meses de diferencia
  const diffYears = deadline.getFullYear() - referenceDate.getFullYear();
  const diffMonths = deadline.getMonth() - referenceDate.getMonth();
  const rawMonths = diffYears * 12 + diffMonths;
  // Si la fecha es en el mes corriente, al menos cuenta como 1 mes restante
  const monthsRemaining = Math.max(1, rawMonths <= 0 ? 1 : rawMonths);

  const recommendedMonthlyContribution = remainingAmount > 0 ? Math.round(remainingAmount / monthsRemaining) : 0;

  return {
    targetAmount,
    currentAmount,
    remainingAmount,
    percentage,
    hasDeadline: true,
    monthsRemaining,
    recommendedMonthlyContribution,
    isCompleted,
  };
}
