import { describe, it, expect } from "vitest";
import { applyRulesToTransaction, TransactionRule, DraftTransactionInput } from "@/lib/rules-engine";
import { Category } from "@/lib/types";

describe("Transaction Rules Engine", () => {
  const categories: Category[] = [
    { id: "supermarket", name: "Supermercado", color: "bg-emerald-500", type: "expense" },
    { id: "transport", name: "Transporte", color: "bg-blue-500", type: "expense" },
    { id: "dining", name: "Gastronomía", color: "bg-orange-500", type: "expense" },
  ];

  const rules: TransactionRule[] = [
    {
      id: "rule-1",
      name: "Auto-categorizar Coto como Supermercado",
      isActive: true,
      priority: 10,
      conditions: [{ field: "description", operator: "contains", value: "coto" }],
      actions: {
        setCategoryId: "supermarket",
        addTags: ["comida", "hogar"],
        cleanDescription: "Coto Supermercado",
      },
      createdAt: new Date(),
    },
    {
      id: "rule-2",
      name: "Tag VIP para montos altos",
      isActive: true,
      priority: 5,
      conditions: [{ field: "amount", operator: "greater_than", value: 50000 }],
      actions: {
        addTags: ["monto-alto"],
      },
      createdAt: new Date(),
    },
    {
      id: "rule-inactive",
      name: "Regla Inactiva",
      isActive: false,
      priority: 20,
      conditions: [{ field: "description", operator: "contains", value: "uber" }],
      actions: {
        setCategoryId: "transport",
      },
      createdAt: new Date(),
    },
  ];

  it("applies category, tags and cleans description when condition matches", () => {
    const inputTx: DraftTransactionInput = {
      description: "COMPRA COTO SUCURSAL 14",
      amount: 12000,
      category: categories[1], // Transporte por defecto
      type: "expense",
      accountId: "acc-1",
    };

    const result = applyRulesToTransaction(inputTx, rules, categories);

    expect(result.category.id).toBe("supermarket");
    expect(result.description).toBe("Coto Supermercado");
    expect(result.tags).toContain("comida");
    expect(result.tags).toContain("hogar");
    expect(result.tags).not.toContain("monto-alto");
  });

  it("applies multiple rules in sequence according to priority", () => {
    const inputTx: DraftTransactionInput = {
      description: "COTO HIPERMERCADO",
      amount: 75000, // mayor a 50.000 -> debe aplicar regla 1 y regla 2
      category: categories[1],
      type: "expense",
      accountId: "acc-1",
    };

    const result = applyRulesToTransaction(inputTx, rules, categories);

    expect(result.category.id).toBe("supermarket");
    expect(result.tags).toContain("comida");
    expect(result.tags).toContain("monto-alto");
  });

  it("ignores inactive rules", () => {
    const inputTx: DraftTransactionInput = {
      description: "Viaje Uber",
      amount: 3500,
      category: categories[2], // Gastronomía
      type: "expense",
      accountId: "acc-1",
    };

    const result = applyRulesToTransaction(inputTx, rules, categories);
    // Debe mantener la categoría original porque rule-inactive no está activa
    expect(result.category.id).toBe("dining");
  });
});
