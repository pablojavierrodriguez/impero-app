import { describe, it, expect } from "vitest";
import { calculateGoalPace } from "@/lib/goal-utils";

describe("Savings Goals Utilities (SPEC-006)", () => {
  it("calculates percentage and remaining without deadline", () => {
    const result = calculateGoalPace(40000, 100000);
    expect(result.percentage).toBe(40);
    expect(result.remainingAmount).toBe(60000);
    expect(result.hasDeadline).toBe(false);
    expect(result.isCompleted).toBe(false);
  });

  it("calculates monthly contribution required when deadline is provided", () => {
    // Referencia: 1 de Enero de 2026. Deadline: 1 de Julio de 2026 (6 meses)
    const ref = new Date(2026, 0, 1);
    const deadline = new Date(2026, 6, 1);

    const result = calculateGoalPace(20000, 80000, deadline, ref);
    expect(result.hasDeadline).toBe(true);
    expect(result.monthsRemaining).toBe(6);
    expect(result.remainingAmount).toBe(60000);
    // 60.000 / 6 meses = 10.000 por mes
    expect(result.recommendedMonthlyContribution).toBe(10000);
  });

  it("identifies goal completion", () => {
    const result = calculateGoalPace(100000, 100000);
    expect(result.isCompleted).toBe(true);
    expect(result.percentage).toBe(100);
    expect(result.remainingAmount).toBe(0);
  });
});
