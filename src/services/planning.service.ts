import { supabase } from "@/integrations/supabase/client";
import { Budget, Goal, BillReminder, Tag, RecurrenceFrequency, RecurringTransaction, Category, TransactionType } from "@/lib/types";
import { Database } from "@/integrations/supabase/types";

type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];
type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];
type BillReminderUpdate = Database["public"]["Tables"]["bill_reminders"]["Update"];

// ===== BUDGETS =====
export async function fetchBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from("budgets").select("*");
  if (error) throw error;
  return (data || []).map((b) => ({
    id: b.id,
    categoryId: b.category_id,
    amount: Number(b.amount),
    month: b.month,
    year: b.year,
    enableRollover: Boolean(b.enable_rollover),
    accumulatedRollover: Number(b.accumulated_rollover) || 0,
  }));
}

export async function insertBudget(budget: Omit<Budget, "id">): Promise<Budget> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      category_id: budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      enable_rollover: budget.enableRollover ?? false,
      accumulated_rollover: budget.accumulatedRollover ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    categoryId: data.category_id,
    amount: Number(data.amount),
    month: data.month,
    year: data.year,
    enableRollover: Boolean(data.enable_rollover),
    accumulatedRollover: Number(data.accumulated_rollover) || 0,
  };
}

export async function updateBudgetRemote(id: string, updates: Partial<Budget>): Promise<void> {
  const payload: BudgetUpdate = {};
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
  if (updates.enableRollover !== undefined) payload.enable_rollover = updates.enableRollover;
  if (updates.accumulatedRollover !== undefined) payload.accumulated_rollover = updates.accumulatedRollover;

  const { error } = await supabase.from("budgets").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteBudgetRemote(id: string): Promise<void> {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

// ===== GOALS =====
export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: Number(g.target_amount),
    currentAmount: Number(g.current_amount),
    deadline: g.deadline ? new Date(g.deadline) : undefined,
    color: g.color,
    icon: g.icon,
    completed: g.completed,
    createdAt: new Date(g.created_at),
  }));
}

export async function insertGoal(goal: Omit<Goal, "id" | "createdAt">): Promise<Goal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline ? goal.deadline.toISOString() : null,
      color: goal.color,
      icon: goal.icon,
      completed: goal.completed,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    targetAmount: Number(data.target_amount),
    currentAmount: Number(data.current_amount),
    deadline: data.deadline ? new Date(data.deadline) : undefined,
    color: data.color,
    icon: data.icon,
    completed: data.completed,
    createdAt: new Date(data.created_at),
  };
}

export async function updateGoalRemote(id: string, updates: Partial<Goal>): Promise<void> {
  const payload: GoalUpdate = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.targetAmount !== undefined) payload.target_amount = updates.targetAmount;
  if (updates.currentAmount !== undefined) payload.current_amount = updates.currentAmount;
  if (updates.deadline !== undefined) payload.deadline = updates.deadline ? updates.deadline.toISOString() : null;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.completed !== undefined) payload.completed = updates.completed;

  const { error } = await supabase.from("goals").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteGoalRemote(id: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

// ===== BILL REMINDERS =====
export async function fetchBills(): Promise<BillReminder[]> {
  const { data, error } = await supabase.from("bill_reminders").select("*").order("due_date", { ascending: true });
  if (error) throw error;
  return (data || []).map((b) => ({
    id: b.id,
    name: b.name,
    amount: Number(b.amount),
    dueDate: new Date(b.due_date),
    frequency: b.frequency as RecurrenceFrequency,
    categoryId: b.category_id || undefined,
    accountId: b.account_id || undefined,
    status: b.status as "pending" | "paid" | "overdue",
    autoPay: b.auto_pay,
  }));
}

export async function insertBill(bill: Omit<BillReminder, "id">): Promise<BillReminder> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");

  const { data, error } = await supabase
    .from("bill_reminders")
    .insert({
      user_id: user.id,
      name: bill.name,
      amount: bill.amount,
      due_date: bill.dueDate.toISOString(),
      frequency: bill.frequency,
      category_id: bill.categoryId || null,
      account_id: bill.accountId || null,
      status: bill.status,
      auto_pay: bill.autoPay,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    amount: Number(data.amount),
    dueDate: new Date(data.due_date),
    frequency: data.frequency as RecurrenceFrequency,
    categoryId: data.category_id || undefined,
    accountId: data.account_id || undefined,
    status: data.status as "pending" | "paid" | "overdue",
    autoPay: data.auto_pay,
  };
}

export async function updateBillRemote(id: string, updates: Partial<BillReminder>): Promise<void> {
  const payload: BillReminderUpdate = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate.toISOString();
  if (updates.frequency !== undefined) payload.frequency = updates.frequency;
  if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
  if (updates.accountId !== undefined) payload.account_id = updates.accountId;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.autoPay !== undefined) payload.auto_pay = updates.autoPay;

  const { error } = await supabase.from("bill_reminders").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteBillRemote(id: string): Promise<void> {
  const { error } = await supabase.from("bill_reminders").delete().eq("id", id);
  if (error) throw error;
}

// ===== RECURRING TRANSACTIONS =====
type RecurringTransactionUpdate = Database["public"]["Tables"]["recurring_transactions"]["Update"];

export async function fetchRecurringTransactions(categories: Category[]): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .order("next_date", { ascending: true });

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
      type: row.type as TransactionType,
      accountId: row.account_id,
      frequency: row.frequency as RecurrenceFrequency,
      startDate: new Date(row.start_date),
      nextDate: new Date(row.next_date),
      paused: row.paused,
      tags: row.tag_ids || undefined,
      currency: (row.currency as any) || "ARS",
    };
  });
}

export async function insertRecurringTransaction(
  rtx: Omit<RecurringTransaction, "id">
): Promise<RecurringTransaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");

  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({
      user_id: user.id,
      amount: rtx.amount,
      description: rtx.description,
      category_id: rtx.category.id !== "uncategorized" ? rtx.category.id : null,
      type: rtx.type,
      account_id: rtx.accountId,
      frequency: rtx.frequency,
      start_date: rtx.startDate.toISOString(),
      next_date: rtx.nextDate.toISOString(),
      paused: rtx.paused,
      tag_ids: rtx.tags || [],
      currency: rtx.currency || "ARS",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    amount: Number(data.amount),
    description: data.description,
    category: rtx.category,
    type: data.type as TransactionType,
    accountId: data.account_id,
    frequency: data.frequency as RecurrenceFrequency,
    startDate: new Date(data.start_date),
    nextDate: new Date(data.next_date),
    paused: data.paused,
    tags: data.tag_ids || undefined,
    currency: (data.currency as any) || "ARS",
  };
}

export async function updateRecurringTransactionRemote(
  id: string,
  updates: Partial<RecurringTransaction>
): Promise<void> {
  const payload: RecurringTransactionUpdate = {};
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category_id = updates.category.id !== "uncategorized" ? updates.category.id : null;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.accountId !== undefined) payload.account_id = updates.accountId;
  if (updates.frequency !== undefined) payload.frequency = updates.frequency;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate.toISOString();
  if (updates.nextDate !== undefined) payload.next_date = updates.nextDate.toISOString();
  if (updates.paused !== undefined) payload.paused = updates.paused;
  if (updates.tags !== undefined) payload.tag_ids = updates.tags;
  if (updates.currency !== undefined) payload.currency = updates.currency;

  const { error } = await supabase.from("recurring_transactions").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteRecurringTransactionRemote(id: string): Promise<void> {
  const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
  if (error) throw error;
}

