import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFinanceStore } from "@/lib/finance-store";
import { insertTransaction } from "@/services/transactions.service";

// Mock auth context
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    session: {},
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock supabase services to avoid actual network calls during unit tests
vi.mock("@/services/accounts.service", () => ({
  fetchAccounts: vi.fn().mockImplementation(() => Promise.resolve([
    { id: "acc-1", name: "Caja Ahorro", balance: 50000, type: "savings", color: "bg-sky-500" },
    { id: "acc-2", name: "Visa Gold", balance: 12000, type: "credit", color: "bg-red-400", creditLimit: 100000 },
  ])),
  insertAccount: vi.fn().mockImplementation((acc) => Promise.resolve({ ...acc, id: "new-acc-id" })),
  updateAccountRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  deleteAccountRemote: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock("@/services/categories.service", () => ({
  fetchCategories: vi.fn().mockImplementation(() => Promise.resolve([
    { id: "cat-1", name: "Alimentación", color: "bg-orange-500", type: "expense" },
    { id: "cat-2", name: "Salario", color: "bg-emerald-500", type: "income" },
  ])),
  insertCategory: vi.fn().mockImplementation((cat) => Promise.resolve({ ...cat, id: "new-cat-id" })),
  updateCategoryRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  deleteCategoryRemote: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock("@/services/transactions.service", () => ({
  fetchTransactions: vi.fn().mockImplementation(() => Promise.resolve([])),
  insertTransaction: vi.fn().mockImplementation((tx) => Promise.resolve({ ...tx, id: tx.id || "new-tx-id" })),
  insertTransactionsBatch: vi.fn().mockImplementation(() => Promise.resolve()),
  updateTransactionRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  deleteTransactionRemote: vi.fn().mockImplementation(() => Promise.resolve()),
}));

vi.mock("@/services/planning.service", () => ({
  fetchBudgets: vi.fn().mockImplementation(() => Promise.resolve([
    { id: "b-1", categoryId: "cat-1", amount: 30000, month: new Date().getMonth(), year: new Date().getFullYear() },
  ])),
  insertBudget: vi.fn().mockImplementation((b) => Promise.resolve({ ...b, id: b.id || "new-b-id" })),
  updateBudgetRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  deleteBudgetRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  fetchGoals: vi.fn().mockImplementation(() => Promise.resolve([])),
  insertGoal: vi.fn().mockImplementation((g) => Promise.resolve({ ...g, id: g.id || "new-g-id", createdAt: new Date() })),
  updateGoalRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  deleteGoalRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  fetchBills: vi.fn().mockImplementation(() => Promise.resolve([])),
  insertBill: vi.fn().mockImplementation((b) => Promise.resolve({ ...b, id: b.id || "bill-test" })),
  updateBillRemote: vi.fn().mockImplementation(() => Promise.resolve()),
  deleteBillRemote: vi.fn().mockImplementation(() => Promise.resolve()),
}));

describe("useFinanceStore Unit & Integration Tests", () => {
  it("initializes without runtime errors and provides finance functions", () => {
    const { result } = renderHook(() => useFinanceStore());

    // Check that store returns all expected properties and handlers
    expect(result.current).toBeDefined();
    expect(typeof result.current.addTransaction).toBe("function");
    expect(typeof result.current.addRecurringTx).toBe("function");
    expect(typeof result.current.updateRecurringTx).toBe("function");
    expect(typeof result.current.deleteRecurringTx).toBe("function");
    expect(typeof result.current.toggleRecurringPause).toBe("function");
    expect(typeof result.current.processRecurring).toBe("function");
    expect(typeof result.current.getCurrentMonthBudgets).toBe("function");
    expect(typeof result.current.getMonthlyTrend).toBe("function");
    expect(typeof result.current.getPendingBills).toBe("function");

    // Check that calling computed functions doesn't throw ReferenceError
    expect(() => result.current.getCurrentMonthBudgets()).not.toThrow();
    expect(() => result.current.getMonthlyTrend()).not.toThrow();
    expect(() => result.current.getPendingBills()).not.toThrow();
  });

  it("calculates budget spent and trends without errors", () => {
    const { result } = renderHook(() => useFinanceStore());
    
    expect(result.current.getBudgetSpent("cat-1", 3, 2026)).toBe(0);
    const trend = result.current.getMonthlyTrend();
    expect(Array.isArray(trend)).toBe(true);
    expect(trend.length).toBe(6);
  });

  it("handles recurring transactions and bills queries", () => {
    const { result } = renderHook(() => useFinanceStore());
    
    expect(Array.isArray(result.current.getPendingBills())).toBe(true);
    expect(typeof result.current.toggleRecurringPause).toBe("function");
  });

  it("passes receiptUrl correctly when creating a transaction via addTransaction", () => {
    const { result } = renderHook(() => useFinanceStore());
    const dummyCategory = { id: "cat-1", name: "Alimentación", color: "bg-orange-500", type: "expense" as const };

    act(() => {
      result.current.addTransaction(
        2500,
        "Supermercado Día",
        dummyCategory,
        "expense",
        "acc-1",
        { receiptUrl: "https://supabase.co/storage/v1/object/public/receipts/user/receipt.jpg" }
      );
    });

    expect(insertTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2500,
        description: "Supermercado Día",
        receiptUrl: "https://supabase.co/storage/v1/object/public/receipts/user/receipt.jpg",
      })
    );
  });
});
