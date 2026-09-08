import { supabase } from "@/integrations/supabase/client";
import { TransactionRule } from "@/lib/rules-engine";

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
    actions: r.actions || {},
    createdAt: new Date(r.created_at),
  }));
}

export async function insertRule(rule: Omit<TransactionRule, "id"> & { id?: string }): Promise<TransactionRule> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const id = rule.id || `rule-${Date.now()}`;
  const { data, error } = await supabase
    .from("transaction_rules" as any)
    .insert({
      id,
      user_id: user.id,
      name: rule.name,
      is_active: rule.isActive,
      priority: rule.priority || 0,
      conditions: rule.conditions || [],
      actions: rule.actions || {},
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
    actions: (data as any).actions,
    createdAt: new Date((data as any).created_at),
  };
}

export async function updateRuleRemote(id: string, updates: Partial<TransactionRule>): Promise<void> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.conditions !== undefined) payload.conditions = updates.conditions;
  if (updates.actions !== undefined) payload.actions = updates.actions;

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
