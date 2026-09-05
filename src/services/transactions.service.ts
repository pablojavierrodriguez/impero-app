import { supabase } from "@/integrations/supabase/client";
import { Transaction, Category, TransactionType } from "@/lib/types";
import { Database } from "@/integrations/supabase/types";

type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

export async function fetchTransactions(categories: Category[]): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;

  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  return (data || []).map((row) => {
    const matchedCategory = row.category_id ? catMap.get(row.category_id) : undefined;
    const category: Category = matchedCategory || {
      id: row.category_id || "uncategorized",
      name: "Sin Categoría",
      color: "bg-zinc-500",
      type: row.type as TransactionType,
      icon: "circle-dot",
    };

    return {
      id: row.id,
      amount: Number(row.amount),
      description: row.description,
      category,
      date: new Date(row.date),
      type: row.type as TransactionType,
      accountId: row.account_id,
      isCardPayment: row.is_card_payment || false,
      isTransfer: row.is_transfer || false,
      tags: row.tag_ids || [],
      note: row.note || undefined,
      receiptUrl: row.receipt_url || undefined,
      recurringId: row.recurring_id || undefined,
      installmentInfo:
        row.installment_current && row.installment_total && row.installment_group_id
          ? {
              current: row.installment_current,
              total: row.installment_total,
              groupId: row.installment_group_id,
            }
          : undefined,
    };
  });
}

export async function insertTransaction(
  tx: Omit<Transaction, "id"> & { id?: string }
): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      amount: tx.amount,
      description: tx.description,
      category_id: tx.category.id !== "uncategorized" ? tx.category.id : null,
      date: tx.date.toISOString(),
      type: tx.type,
      account_id: tx.accountId,
      is_card_payment: tx.isCardPayment || false,
      is_transfer: tx.isTransfer || false,
      tag_ids: tx.tags || [],
      note: tx.note || null,
      receipt_url: tx.receiptUrl || null,
      recurring_id: tx.recurringId || null,
      installment_current: tx.installmentInfo?.current || null,
      installment_total: tx.installmentInfo?.total || null,
      installment_group_id: tx.installmentInfo?.groupId || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...tx,
    id: data.id,
  };
}

export async function insertTransactionsBatch(
  txs: Omit<Transaction, "id">[]
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const payload = txs.map((tx) => ({
    user_id: user.id,
    amount: tx.amount,
    description: tx.description,
    category_id: tx.category.id !== "uncategorized" ? tx.category.id : null,
    date: tx.date.toISOString(),
    type: tx.type,
    account_id: tx.accountId,
    is_card_payment: tx.isCardPayment || false,
    is_transfer: tx.isTransfer || false,
    tag_ids: tx.tags || [],
    note: tx.note || null,
    receipt_url: tx.receiptUrl || null,
    recurring_id: tx.recurringId || null,
    installment_current: tx.installmentInfo?.current || null,
    installment_total: tx.installmentInfo?.total || null,
    installment_group_id: tx.installmentInfo?.groupId || null,
  }));

  const { error } = await supabase.from("transactions").insert(payload);
  if (error) throw error;
}

export async function updateTransactionRemote(
  id: string,
  updates: Partial<Transaction>
): Promise<void> {
  const payload: TransactionUpdate = {};
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category_id = updates.category.id;
  if (updates.date !== undefined) payload.date = updates.date.toISOString();
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.accountId !== undefined) payload.account_id = updates.accountId;
  if (updates.isCardPayment !== undefined) payload.is_card_payment = updates.isCardPayment;
  if (updates.isTransfer !== undefined) payload.is_transfer = updates.isTransfer;
  if (updates.tags !== undefined) payload.tag_ids = updates.tags;
  if (updates.note !== undefined) payload.note = updates.note;
  if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl;

  const { error } = await supabase.from("transactions").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteTransactionRemote(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteTransactionsByGroupIdRemote(groupId: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("installment_group_id", groupId);
  if (error) throw error;
}
