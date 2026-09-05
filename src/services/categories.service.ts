import { supabase } from "@/integrations/supabase/client";
import { Category, TransactionType } from "@/lib/types";
import { Database } from "@/integrations/supabase/types";

type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    type: row.type as TransactionType,
    icon: row.icon || undefined,
    parentId: row.parent_id,
    archived: row.archived,
    order: row.sort_order,
  }));
}

export async function insertCategory(cat: Omit<Category, "id">): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: cat.name,
      color: cat.color,
      type: cat.type,
      icon: cat.icon || null,
      parent_id: cat.parentId || null,
      archived: cat.archived || false,
      sort_order: cat.order || 0,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    type: data.type as TransactionType,
    icon: data.icon || undefined,
    parentId: data.parent_id,
    archived: data.archived,
    order: data.sort_order,
  };
}

export async function updateCategoryRemote(id: string, updates: Partial<Category>): Promise<void> {
  const payload: CategoryUpdate = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.parentId !== undefined) payload.parent_id = updates.parentId;
  if (updates.archived !== undefined) payload.archived = updates.archived;
  if (updates.order !== undefined) payload.sort_order = updates.order;

  const { error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCategoryRemote(id: string): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
