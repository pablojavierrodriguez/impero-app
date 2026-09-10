import { supabase } from "@/integrations/supabase/client";
import { ShoppingList, ShoppingListItem, ShoppingListStatus } from "@/lib/types";
import { Database } from "@/integrations/supabase/types";

type ShoppingListRow = Database["public"]["Tables"]["shopping_lists"]["Row"];
type ShoppingListItemRow = Database["public"]["Tables"]["shopping_list_items"]["Row"];

export async function fetchShoppingLists(): Promise<ShoppingList[]> {
  const { data: listsData, error: listsError } = await supabase
    .from("shopping_lists")
    .select("*")
    .order("created_at", { ascending: false });

  if (listsError) throw listsError;
  if (!listsData || listsData.length === 0) return [];

  const listIds = listsData.map((l) => l.id);

  const { data: itemsData, error: itemsError } = await supabase
    .from("shopping_list_items")
    .select("*")
    .in("list_id", listIds)
    .order("sort_order", { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByList = new Map<string, ShoppingListItem[]>();
  for (const item of itemsData || []) {
    const mappedItem: ShoppingListItem = {
      id: item.id,
      listId: item.list_id,
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || 0,
      isChecked: item.is_checked,
      sortOrder: item.sort_order,
    };
    const current = itemsByList.get(item.list_id) || [];
    current.push(mappedItem);
    itemsByList.set(item.list_id, current);
  }

  return listsData.map((l: ShoppingListRow): ShoppingList => ({
    id: l.id,
    name: l.name,
    status: (l.status as ShoppingListStatus) || "active",
    targetAccountId: l.target_account_id,
    targetCategoryId: l.target_category_id,
    items: itemsByList.get(l.id) || [],
    createdAt: new Date(l.created_at),
    updatedAt: new Date(l.updated_at),
  }));
}

export async function createShoppingList(
  name: string,
  targetAccountId?: string | null,
  targetCategoryId?: string | null
): Promise<ShoppingList> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({
      user_id: user.id,
      name: name.trim(),
      status: "active",
      target_account_id: targetAccountId || null,
      target_category_id: targetCategoryId || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    status: data.status as ShoppingListStatus,
    targetAccountId: data.target_account_id,
    targetCategoryId: data.target_category_id,
    items: [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function updateShoppingListRemote(
  id: string,
  updates: Partial<{
    name: string;
    status: ShoppingListStatus;
    targetAccountId: string | null;
    targetCategoryId: string | null;
  }>
): Promise<void> {
  const payload: Partial<Database["public"]["Tables"]["shopping_lists"]["Update"]> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.targetAccountId !== undefined) payload.target_account_id = updates.targetAccountId;
  if (updates.targetCategoryId !== undefined) payload.target_category_id = updates.targetCategoryId;

  const { error } = await supabase
    .from("shopping_lists")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteShoppingListRemote(id: string): Promise<void> {
  const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
  if (error) throw error;
}

export async function createShoppingListItemRemote(
  item: Omit<ShoppingListItem, "id">
): Promise<ShoppingListItem> {
  const { data, error } = await supabase
    .from("shopping_list_items")
    .insert({
      list_id: item.listId,
      name: item.name.trim(),
      quantity: item.quantity,
      unit_price: item.unitPrice,
      is_checked: item.isChecked,
      sort_order: item.sortOrder,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    listId: data.list_id,
    name: data.name,
    quantity: Number(data.quantity) || 1,
    unitPrice: Number(data.unit_price) || 0,
    isChecked: data.is_checked,
    sortOrder: data.sort_order,
  };
}

export async function updateShoppingListItemRemote(
  id: string,
  updates: Partial<{
    name: string;
    quantity: number;
    unitPrice: number;
    isChecked: boolean;
    sortOrder: number;
  }>
): Promise<void> {
  const payload: Partial<Database["public"]["Tables"]["shopping_list_items"]["Update"]> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.quantity !== undefined) payload.quantity = updates.quantity;
  if (updates.unitPrice !== undefined) payload.unit_price = updates.unitPrice;
  if (updates.isChecked !== undefined) payload.is_checked = updates.isChecked;
  if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;

  const { error } = await supabase
    .from("shopping_list_items")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteShoppingListItemRemote(id: string): Promise<void> {
  const { error } = await supabase.from("shopping_list_items").delete().eq("id", id);
  if (error) throw error;
}
