import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { Category, Account } from "@/lib/types";
import { SettingsProvider } from "@/lib/settings-store";
import React from "react";

describe("QuickAddSheet Smart Chips Frequency Ordering", () => {
  const dummyAccounts: Account[] = [
    { id: "acc-1", name: "Efectivo", balance: 1000, type: "cash", color: "bg-emerald-500", currency: "ARS" },
  ];

  const dummyCategories: Category[] = [
    { id: "cat-1", name: "Supermercado", color: "bg-blue-500", type: "expense" },
    { id: "cat-2", name: "Transporte", color: "bg-orange-500", type: "expense" },
    { id: "cat-3", name: "Servicios", color: "bg-yellow-500", type: "expense" },
    { id: "cat-4", name: "Restaurantes", color: "bg-red-500", type: "expense" },
    { id: "cat-5", name: "Salud", color: "bg-green-500", type: "expense" },
    { id: "cat-6", name: "Suscripciones", color: "bg-purple-500", type: "expense" },
  ];

  it("prioritizes categories with higher transaction frequency in top Smart Chips", () => {
    // Frequency map:
    // cat-6 (Suscripciones): 20 txs
    // cat-4 (Restaurantes): 15 txs
    // cat-2 (Transporte): 10 txs
    // cat-1 (Supermercado): 5 txs
    // cat-3 & cat-5: 0 txs
    const frequencyMap: Record<string, number> = {
      "cat-6": 20,
      "cat-4": 15,
      "cat-2": 10,
      "cat-1": 5,
      "cat-3": 0,
      "cat-5": 0,
    };

    const getTransactionCountByCategory = (id: string) => frequencyMap[id] ?? 0;

    render(
      <SettingsProvider>
        <QuickAddSheet
          open={true}
          onClose={() => {}}
          onSubmit={() => {}}
          accounts={dummyAccounts}
          categories={dummyCategories}
          initialType="expense"
          getTransactionCountByCategory={getTransactionCountByCategory}
        />
      </SettingsProvider>
    );

    // Enter an amount so Smart Chips appear
    const digit1 = screen.getByRole("button", { name: "1" });
    act(() => {
      fireEvent.click(digit1);
    });

    // Verify the top categories shown in Smart Chips are the 4 most frequent:
    // 1: Suscripciones (20), 2: Restaurantes (15), 3: Transporte (10), 4: Supermercado (5)
    expect(screen.getByText("Suscripciones")).toBeInTheDocument();
    expect(screen.getByText("Restaurantes")).toBeInTheDocument();
    expect(screen.getByText("Transporte")).toBeInTheDocument();
    expect(screen.getByText("Supermercado")).toBeInTheDocument();

    // The less frequent ones (Servicios, Salud) should NOT be in the top 4 smart chips
    expect(screen.queryByText("Servicios")).not.toBeInTheDocument();
    expect(screen.queryByText("Salud")).not.toBeInTheDocument();
  });
});
