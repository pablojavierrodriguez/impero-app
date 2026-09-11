import { supabase } from "@/integrations/supabase/client";
import { TransactionRule } from "@/lib/rules-engine";
import { Category } from "@/lib/types";

export async function fetchRules(): Promise<TransactionRule[]> {
  const { data, error } = await supabase
    .from("transaction_rules" as any)
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    isActive: r.is_active,
    priority: r.priority,
    conditions: r.conditions || [],
    matchMode: r.actions?.matchMode || r.match_mode || "all",
    actions: r.actions || {},
    createdAt: new Date(r.created_at),
  }));
}

export async function insertRule(rule: Omit<TransactionRule, "id"> & { id?: string }): Promise<TransactionRule> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const id = rule.id || `rule-${Date.now()}`;
  const actionsWithMatchMode = {
    ...rule.actions,
    ...(rule.matchMode ? { matchMode: rule.matchMode } : {}),
  };

  const { data, error } = await supabase
    .from("transaction_rules" as any)
    .insert({
      id,
      user_id: user.id,
      name: rule.name,
      is_active: rule.isActive,
      priority: rule.priority || 0,
      conditions: rule.conditions || [],
      actions: actionsWithMatchMode,
      created_at: (rule.createdAt || new Date()).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: (data as any).id,
    name: (data as any).name,
    isActive: (data as any).is_active,
    priority: (data as any).priority,
    conditions: (data as any).conditions,
    matchMode: (data as any).actions?.matchMode || "all",
    actions: (data as any).actions,
    createdAt: new Date((data as any).created_at),
  };
}

export async function insertRulesBatch(
  rulesToInsert: (Omit<TransactionRule, "id"> & { id?: string })[]
): Promise<TransactionRule[]> {
  if (rulesToInsert.length === 0) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const timestamp = Date.now();
  const payload = rulesToInsert.map((r, i) => ({
    id: r.id || `rule-${timestamp}-${i}`,
    user_id: user.id,
    name: r.name,
    is_active: r.isActive,
    priority: r.priority ?? (rulesToInsert.length - i),
    conditions: r.conditions || [],
    actions: {
      ...r.actions,
      ...(r.matchMode ? { matchMode: r.matchMode } : {}),
    },
    created_at: (r.createdAt || new Date()).toISOString(),
  }));

  const { data, error } = await supabase
    .from("transaction_rules" as any)
    .insert(payload)
    .select();

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    isActive: r.is_active,
    priority: r.priority,
    conditions: r.conditions || [],
    matchMode: r.actions?.matchMode || "all",
    actions: r.actions || {},
    createdAt: new Date(r.created_at),
  }));
}

export async function updateRuleRemote(id: string, updates: Partial<TransactionRule>): Promise<void> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.conditions !== undefined) payload.conditions = updates.conditions;
  if (updates.actions !== undefined || updates.matchMode !== undefined) {
    payload.actions = {
      ...(updates.actions || {}),
      ...(updates.matchMode ? { matchMode: updates.matchMode } : {}),
    };
  }

  const { error } = await supabase
    .from("transaction_rules" as any)
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteRuleRemote(id: string): Promise<void> {
  const { error } = await supabase
    .from("transaction_rules" as any)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Genera el conjunto de plantillas de reglas predeterminadas adaptadas a las categorías reales del usuario
 */
export function createDefaultRulesTemplates(categories: Category[]): Omit<TransactionRule, "id">[] {
  const templates: Omit<TransactionRule, "id">[] = [];

  // Helper para buscar categorías por regex o nombre
  const findCat = (pattern: RegExp, type: "income" | "expense") =>
    categories.find((c) => c.type === type && pattern.test(c.name.toLowerCase()));

  const salaryCat = findCat(/sueldo|haberes|salary|ingreso laboral/i, "income");
  if (salaryCat) {
    templates.push({
      name: "Sueldos y Haberes Laborales",
      isActive: true,
      priority: 100,
      matchMode: "any",
      conditions: [
        {
          field: "description",
          operator: "contains_any",
          value: "sueldo, haberes, remuneracion, honorarios, sueldos op.",
        },
      ],
      actions: {
        setCategoryId: salaryCat.id,
        setType: "income",
      },
      createdAt: new Date(),
    });
  }

  const investCat =
    findCat(/rendimiento|invers|investment|inter[eé]s/i, "income") ||
    findCat(/otros?|general/i, "income") ||
    categories.find((c) => c.type === "income");
  if (investCat) {
    templates.push({
      name: "Intereses y Rendimientos de Cuentas",
      isActive: true,
      priority: 95,
      matchMode: "any",
      conditions: [
        {
          field: "description",
          operator: "contains_any",
          value: "interes, intereses, intereses ganados, rendimiento, plazo fijo, fci, dividendo, caucion, renta",
        },
      ],
      actions: {
        setCategoryId: investCat.id,
        setType: "income",
      },
      createdAt: new Date(),
    });
  }

  const groceriesCat =
    findCat(/supermercado/i, "expense") ||
    findCat(/alimentaci[oó]n|comestibles|groceries/i, "expense");
  if (groceriesCat) {
    templates.push({
      name: "Supermercados y Comestibles",
      isActive: true,
      priority: 90,
      matchMode: "any",
      conditions: [
        {
          field: "description",
          operator: "contains_any",
          value: "coto, carrefour, dia %, jumbo, disco, vea, changomas, makro, vital",
        },
      ],
      actions: {
        setCategoryId: groceriesCat.id,
        setType: "expense",
      },
      createdAt: new Date(),
    });
  }

  const fuelCat =
    findCat(/combustible/i, "expense") ||
    findCat(/transporte|movilidad/i, "expense");
  if (fuelCat) {
    templates.push({
      name: "Combustible y Estaciones de Servicio",
      isActive: true,
      priority: 85,
      matchMode: "any",
      conditions: [
        {
          field: "description",
          operator: "contains_any",
          value: "ypf, shell, axion, puma energy",
        },
      ],
      actions: {
        setCategoryId: fuelCat.id,
        setType: "expense",
      },
      createdAt: new Date(),
    });
  }

  const servicesCat =
    findCat(/servicio/i, "expense") ||
    findCat(/impuesto|factura|bills/i, "expense");
  if (servicesCat) {
    templates.push({
      name: "Servicios Públicos y Facturas",
      isActive: true,
      priority: 80,
      matchMode: "any",
      conditions: [
        {
          field: "description",
          operator: "contains_any",
          value: "edenor, edesur, metrogas, aysa, telecom, fibertel, personal, flow, telecentro, arba, agip",
        },
      ],
      actions: {
        setCategoryId: servicesCat.id,
        setType: "expense",
      },
      createdAt: new Date(),
    });
  }

  // Regla general para pagos de resumen de tarjetas
  templates.push({
    name: "Pagos de Tarjetas de Crédito",
    isActive: true,
    priority: 75,
    matchMode: "any",
    conditions: [
      {
        field: "description",
        operator: "contains_any",
        value: "pago de tarjeta, pago tarjeta, pago visa, pago mastercard, su pago en pesos",
      },
    ],
    actions: {
      setIsCardPayment: true,
      cleanDescription: "Pago de Resumen de Tarjeta",
    },
    createdAt: new Date(),
  });

  return templates;
}
