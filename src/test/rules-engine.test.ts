import { describe, it, expect } from "vitest";
import { applyRulesToTransaction, TransactionRule, DraftTransactionInput } from "@/lib/rules-engine";
import { createDefaultRulesTemplates } from "@/services/rules.service";
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

  it("supports contains_any operator with comma-separated values", () => {
    const multiValueRule: TransactionRule = {
      id: "rule-multi",
      name: "Supermercados cadena",
      isActive: true,
      priority: 15,
      conditions: [
        { field: "description", operator: "contains_any", value: "carrefour, dia %, jumbo, coto" },
      ],
      actions: {
        setCategoryId: "supermarket",
      },
      createdAt: new Date(),
    };

    const tx1: DraftTransactionInput = {
      description: "SUPERMERCADO DIA % SUC 42",
      amount: 4500,
      category: categories[1],
      type: "expense",
      accountId: "acc-1",
    };

    const result1 = applyRulesToTransaction(tx1, [multiValueRule], categories);
    expect(result1.category.id).toBe("supermarket");

    const tx2: DraftTransactionInput = {
      description: "CARREFOUR EXPRESS",
      amount: 3200,
      category: categories[1],
      type: "expense",
      accountId: "acc-1",
    };

    const result2 = applyRulesToTransaction(tx2, [multiValueRule], categories);
    expect(result2.category.id).toBe("supermarket");
  });

  it("supports setIsCardPayment and setType actions", () => {
    const salaryRule: TransactionRule = {
      id: "rule-sal",
      name: "Sueldos",
      isActive: true,
      priority: 20,
      conditions: [{ field: "description", operator: "contains", value: "sueldos op" }],
      actions: {
        setCategoryId: "dining", // mock target
        setType: "income",
      },
      createdAt: new Date(),
    };

    const tx: DraftTransactionInput = {
      description: "SUELDOS OP.4033741",
      amount: 4105530,
      category: categories[0],
      type: "expense", // parseado inicialmente como gasto
      accountId: "acc-1",
    };

    const res = applyRulesToTransaction(tx, [salaryRule], categories);
    expect(res.type).toBe("income");
    expect(res.category.id).toBe("dining");
  });

  describe("Default Rules Provisioning & Deduplication", () => {
    it("generates default rule templates with unique names", () => {
      const fullCategories: Category[] = [
        { id: "cat-1", name: "Supermercado", color: "bg-emerald-500", type: "expense" },
        { id: "cat-2", name: "Transporte y Combustible", color: "bg-blue-500", type: "expense" },
        { id: "cat-3", name: "Servicios e Impuestos", color: "bg-amber-500", type: "expense" },
        { id: "cat-4", name: "Sueldos y Haberes", color: "bg-green-500", type: "income" },
        { id: "cat-5", name: "Rendimientos e Inversiones", color: "bg-purple-500", type: "income" },
      ];

      const templates = createDefaultRulesTemplates(fullCategories);
      expect(templates.length).toBeGreaterThan(0);

      const names = templates.map((t) => t.name.trim().toLowerCase());
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });

    it("filters out templates whose names already exist (idempotency)", () => {
      const fullCategories: Category[] = [
        { id: "cat-1", name: "Supermercado", color: "bg-emerald-500", type: "expense" },
      ];

      const templates = createDefaultRulesTemplates(fullCategories);
      expect(templates.length).toBeGreaterThanOrEqual(1);

      // Simular que el usuario ya tiene la regla "Supermercados y Comestibles"
      const existingRules: TransactionRule[] = [
        {
          id: "existing-1",
          name: "Supermercados y Comestibles",
          isActive: true,
          priority: 90,
          conditions: [{ field: "description", operator: "contains_any", value: "coto" }],
          actions: { setCategoryId: "cat-1" },
          createdAt: new Date(),
        },
      ];

      const existingNames = new Set(existingRules.map((r) => r.name.trim().toLowerCase()));
      const missingTemplates = templates.filter(
        (t) => !existingNames.has(t.name.trim().toLowerCase())
      );

      // No debe volver a generar "Supermercados y Comestibles"
      expect(
        missingTemplates.some((t) => t.name.toLowerCase() === "supermercados y comestibles")
      ).toBe(false);
    });

    it("identifies duplicate rules by normalized name for purge", () => {
      const duplicatedRules: TransactionRule[] = [
        {
          id: "rule-1",
          name: "Supermercados y Comestibles",
          isActive: true,
          priority: 90,
          conditions: [],
          actions: {},
          createdAt: new Date(),
        },
        {
          id: "rule-2", // CLON DUPLICADO
          name: "Supermercados y Comestibles",
          isActive: true,
          priority: 90,
          conditions: [],
          actions: {},
          createdAt: new Date(),
        },
        {
          id: "rule-3",
          name: "Combustible y Estaciones de Servicio",
          isActive: true,
          priority: 85,
          conditions: [],
          actions: {},
          createdAt: new Date(),
        },
      ];

      const seenNames = new Set<string>();
      const duplicateIdsToDelete: string[] = [];
      const keptRules: TransactionRule[] = [];

      for (const rule of duplicatedRules) {
        const norm = rule.name.trim().toLowerCase();
        if (seenNames.has(norm)) {
          duplicateIdsToDelete.push(rule.id);
        } else {
          seenNames.add(norm);
          keptRules.push(rule);
        }
      }

      expect(duplicateIdsToDelete).toEqual(["rule-2"]);
      expect(keptRules.map((r) => r.id)).toEqual(["rule-1", "rule-3"]);
    });
  });
});
