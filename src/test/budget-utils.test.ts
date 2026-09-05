import { describe, it, expect } from "vitest";
import { calculateBudgetMetrics, calculateSuggestedBudget } from "@/lib/budget-utils";

describe("Budget Utils & Intelligence Metrics (SPEC-005)", () => {
  it("calculates days remaining and elapsed percentage accurately", () => {
    // 15 de marzo de 2026 (mes de 31 días)
    const midMonth = new Date(2026, 2, 15);
    const metrics = calculateBudgetMetrics(15000, 30000, midMonth);

    expect(metrics.daysInMonth).toBe(31);
    expect(metrics.currentDay).toBe(15);
    expect(metrics.daysRemaining).toBe(17); // 31 - 15 + 1
    expect(metrics.remaining).toBe(15000);
    expect(metrics.dailyAllowanceRemaining).toBeCloseTo(15000 / 17, 1);
  });

  it("detects pace warning when spending velocity will exceed budget at month end", () => {
    // Día 5 del mes de 30 días (16.6% del tiempo) con el 50% ya gastado
    const earlyMonth = new Date(2026, 3, 5);
    const metrics = calculateBudgetMetrics(25000, 50000, earlyMonth);

    // Gasto proyectado = 5000/día * 30 días = 150000 > 50000
    expect(metrics.projectedEndMonthSpent).toBe(150000);
    expect(metrics.isPaceWarning).toBe(true);
    expect(metrics.isOverBudget).toBe(false);
    expect(metrics.status).toBe("warning");
  });

  it("flags danger when budget is exceeded", () => {
    const date = new Date(2026, 2, 20);
    const metrics = calculateBudgetMetrics(35000, 30000, date);

    expect(metrics.isOverBudget).toBe(true);
    expect(metrics.remaining).toBe(0);
    expect(metrics.status).toBe("danger");
  });

  it("calculates suggested budget based on last 3 months average", () => {
    const dummyTransactions = [
      // Mes anterior (-1): $20.000
      { amount: 20000, type: "expense", category: { id: "cat-groceries" }, date: new Date(2026, 1, 10) },
      // Mes ante-anterior (-2): $25.000
      { amount: 25000, type: "expense", category: { id: "cat-groceries" }, date: new Date(2026, 0, 15) },
      // Hace 3 meses (-3): $30.000
      { amount: 30000, type: "expense", category: { id: "cat-groceries" }, date: new Date(2025, 11, 20) },
      // Otra categoría que no debe sumar:
      { amount: 10000, type: "expense", category: { id: "cat-other" }, date: new Date(2026, 1, 5) },
    ];

    const refDate = new Date(2026, 2, 1); // Marzo 2026
    const suggested = calculateSuggestedBudget(dummyTransactions, "cat-groceries", 3, refDate);

    // Promedio: (20000 + 25000 + 30000) / 3 = 25000
    expect(suggested).toBe(25000);
  });
});
