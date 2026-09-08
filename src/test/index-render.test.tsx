import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Index from "@/pages/Index";
import { SettingsProvider } from "@/lib/settings-store";
import { PrivacyProvider } from "@/contexts/PrivacyContext";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    session: {},
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/services/accounts.service", () => ({
  fetchAccounts: vi.fn().mockResolvedValue([
    { id: "acc-1", name: "Efectivo", balance: 15000, type: "cash", color: "bg-emerald-500" },
  ]),
  insertAccount: vi.fn().mockResolvedValue({}),
  updateAccountRemote: vi.fn().mockResolvedValue(undefined),
  deleteAccountRemote: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/categories.service", () => ({
  fetchCategories: vi.fn().mockResolvedValue([
    { id: "cat-1", name: "Alimentación", color: "bg-orange-500", type: "expense" },
  ]),
  insertCategory: vi.fn().mockResolvedValue({}),
  updateCategoryRemote: vi.fn().mockResolvedValue(undefined),
  deleteCategoryRemote: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/transactions.service", () => ({
  fetchTransactions: vi.fn().mockResolvedValue([]),
  insertTransaction: vi.fn().mockResolvedValue({}),
  insertTransactionsBatch: vi.fn().mockResolvedValue(undefined),
  updateTransactionRemote: vi.fn().mockResolvedValue(undefined),
  deleteTransactionRemote: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/planning.service", () => ({
  fetchBudgets: vi.fn().mockResolvedValue([]),
  insertBudget: vi.fn().mockResolvedValue({}),
  updateBudgetRemote: vi.fn().mockResolvedValue(undefined),
  deleteBudgetRemote: vi.fn().mockResolvedValue(undefined),
  fetchGoals: vi.fn().mockResolvedValue([]),
  insertGoal: vi.fn().mockResolvedValue({}),
  updateGoalRemote: vi.fn().mockResolvedValue(undefined),
  deleteGoalRemote: vi.fn().mockResolvedValue(undefined),
  fetchBills: vi.fn().mockResolvedValue([]),
  insertBill: vi.fn().mockResolvedValue({}),
  updateBillRemote: vi.fn().mockResolvedValue(undefined),
  deleteBillRemote: vi.fn().mockResolvedValue(undefined),
  fetchRecurringTransactions: vi.fn().mockResolvedValue([]),
  insertRecurringTransaction: vi.fn().mockResolvedValue({}),
  updateRecurringTransactionRemote: vi.fn().mockResolvedValue(undefined),
  deleteRecurringTransactionRemote: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/tags.service", () => ({
  fetchTags: vi.fn().mockResolvedValue([]),
  insertTag: vi.fn().mockResolvedValue({ id: "test-tag", name: "Test", color: "bg-blue-500" }),
  updateTagRemote: vi.fn().mockResolvedValue(undefined),
  deleteTagRemote: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/rules.service", () => ({
  fetchRules: vi.fn().mockResolvedValue([]),
  insertRule: vi.fn().mockResolvedValue({ id: "test-rule", name: "Rule", isActive: true, priority: 0, conditions: [], actions: {}, createdAt: new Date() }),
  updateRuleRemote: vi.fn().mockResolvedValue(undefined),
  deleteRuleRemote: vi.fn().mockResolvedValue(undefined),
}));

describe("Index Page Smoke & Render Test", () => {
  it("renders Index component without throwing unhandled exceptions or blank screen", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <PrivacyProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Index />
            </BrowserRouter>
          </PrivacyProvider>
        </SettingsProvider>
      </QueryClientProvider>
    );

    // Verify critical dashboard elements mount
    expect(document.querySelector(".min-h-screen")).toBeInTheDocument();
  });
});
