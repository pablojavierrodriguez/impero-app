import { Category, TransactionType } from "./types";

export type RuleField = "description" | "amount" | "accountId" | "type";
export type RuleOperator = "contains" | "contains_any" | "equals" | "starts_with" | "greater_than" | "less_than";

export interface RuleCondition {
  field: RuleField;
  operator: RuleOperator;
  value: string | number;
}

export interface RuleActions {
  setCategoryId?: string;
  addTags?: string[];
  cleanDescription?: string;
  setType?: TransactionType;
  setIsTransfer?: boolean;
  setIsCardPayment?: boolean;
}

export interface TransactionRule {
  id: string;
  name: string;
  isActive: boolean;
  priority: number;
  conditions: RuleCondition[];
  matchMode?: "all" | "any";
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
  isTransfer?: boolean;
  isCardPayment?: boolean;
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
      if (condition.operator === "contains_any") {
        const tokens = val.split(/[,|]/).map((t) => t.trim()).filter(Boolean);
        return tokens.some((token) => desc.includes(token));
      }
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

    // Evaluar según matchMode (por defecto 'all' / AND)
    const matchMode = rule.matchMode || "all";
    const matches =
      matchMode === "any"
        ? rule.conditions.some((cond) => evaluateCondition(result, cond))
        : rule.conditions.every((cond) => evaluateCondition(result, cond));

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

      // 4. Asignar tipo (income / expense)
      if (rule.actions.setType) {
        result.type = rule.actions.setType;
      }

      // 5. Flags de transferencia o pago de tarjeta
      if (rule.actions.setIsTransfer !== undefined) {
        result.isTransfer = rule.actions.setIsTransfer;
      }
      if (rule.actions.setIsCardPayment !== undefined) {
        result.isCardPayment = rule.actions.setIsCardPayment;
      }
    }
  }

  return result;
}
