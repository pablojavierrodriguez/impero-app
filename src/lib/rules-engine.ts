import { Category, TransactionType } from "./types";

export type RuleField = "description" | "amount" | "accountId" | "type";
export type RuleOperator = "contains" | "equals" | "starts_with" | "greater_than" | "less_than";

export interface RuleCondition {
  field: RuleField;
  operator: RuleOperator;
  value: string | number;
}

export interface RuleActions {
  setCategoryId?: string;
  addTags?: string[];
  cleanDescription?: string;
}

export interface TransactionRule {
  id: string;
  name: string;
  isActive: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleActions;
  createdAt: Date;
}

export interface DraftTransactionInput {
  amount: number;
  description: string;
  category: Category;
  type: TransactionType;
  accountId: string;
  tags?: string[];
  note?: string;
}

/**
 * Evalúa si una transacción cumple una condición individual
 */
export function evaluateCondition(tx: DraftTransactionInput, condition: RuleCondition): boolean {
  switch (condition.field) {
    case "description": {
      const desc = (tx.description || "").toLowerCase();
      const val = String(condition.value || "").toLowerCase();
      if (condition.operator === "contains") return desc.includes(val);
      if (condition.operator === "starts_with") return desc.startsWith(val);
      if (condition.operator === "equals") return desc === val;
      return false;
    }
    case "amount": {
      const amt = tx.amount;
      const val = Number(condition.value);
      if (isNaN(val)) return false;
      if (condition.operator === "greater_than") return amt > val;
      if (condition.operator === "less_than") return amt < val;
      if (condition.operator === "equals") return amt === val;
      return false;
    }
    case "accountId": {
      return condition.operator === "equals" ? tx.accountId === condition.value : false;
    }
    case "type": {
      return condition.operator === "equals" ? tx.type === condition.value : false;
    }
    default:
      return false;
  }
}

/**
 * Aplica todas las reglas activas ordenadas por prioridad sobre una transacción entrante
 */
export function applyRulesToTransaction(
  tx: DraftTransactionInput,
  rules: TransactionRule[],
  availableCategories: Category[]
): DraftTransactionInput {
  // Clonar para garantizar inmutabilidad
  let result: DraftTransactionInput = {
    ...tx,
    tags: tx.tags ? [...tx.tags] : [],
  };

  const activeRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of activeRules) {
    if (!rule.conditions || rule.conditions.length === 0) continue;

    // Todas las condiciones de la regla deben cumplirse (AND)
    const matches = rule.conditions.every((cond) => evaluateCondition(result, cond));

    if (matches) {
      // 1. Asignar categoría si está configurada
      if (rule.actions.setCategoryId) {
        const cat = availableCategories.find((c) => c.id === rule.actions.setCategoryId);
        if (cat) {
          result.category = cat;
        }
      }

      // 2. Agregar tags sin duplicar
      if (rule.actions.addTags && rule.actions.addTags.length > 0) {
        const existingTags = new Set(result.tags || []);
        for (const tag of rule.actions.addTags) {
          existingTags.add(tag);
        }
        result.tags = Array.from(existingTags);
      }

      // 3. Normalizar o limpiar descripción
      if (rule.actions.cleanDescription && rule.actions.cleanDescription.trim()) {
        result.description = rule.actions.cleanDescription.trim();
      }
    }
  }

  return result;
}
