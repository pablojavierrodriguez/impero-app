import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShoppingListManager } from "@/components/ShoppingListManager";
import { SettingsProvider } from "@/lib/settings-store";
import { ShoppingList } from "@/lib/types";

// Mock shopping service
vi.mock("@/services/shopping.service", () => {
  let storedLists: ShoppingList[] = [];
  return {
    fetchShoppingLists: vi.fn().mockImplementation(() => Promise.resolve(storedLists)),
    createShoppingList: vi.fn().mockImplementation((name: string) => {
      const newList: ShoppingList = {
        id: `list-${Date.now()}`,
        name,
        status: "active",
        targetAccountId: null,
        targetCategoryId: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      storedLists.push(newList);
      return Promise.resolve(newList);
    }),
    updateShoppingListRemote: vi.fn().mockImplementation((id: string, updates: any) => {
      storedLists = storedLists.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l);
      return Promise.resolve();
    }),
    deleteShoppingListRemote: vi.fn().mockImplementation((id: string) => {
      storedLists = storedLists.filter(l => l.id !== id);
      return Promise.resolve();
    }),
    createShoppingListItemRemote: vi.fn().mockImplementation((item: any) => Promise.resolve({
      ...item,
      id: `item-${Date.now()}`,
    })),
    updateShoppingListItemRemote: vi.fn().mockResolvedValue(undefined),
    deleteShoppingListItemRemote: vi.fn().mockResolvedValue(undefined),
    getStoredShoppingLists: vi.fn().mockImplementation(() => storedLists),
    saveStoredShoppingLists: vi.fn().mockImplementation((lists: ShoppingList[]) => {
      storedLists = lists;
    }),
    getPendingShoppingSyncCount: vi.fn().mockReturnValue(0),
    syncPendingShoppingQueue: vi.fn().mockResolvedValue(undefined),
    _setStoredLists: (lists: ShoppingList[]) => {
      storedLists = lists;
    },
  };
});

describe("ShoppingListManager Lifecycle & UX Unificada", () => {
  const mockAccounts = [
    { id: "acc-1", name: "Mercado Pago", balance: 50000, type: "checking" as const, color: "bg-blue-500", archived: false },
  ];
  const mockCategories = [
    { id: "cat-1", name: "Supermercado", color: "bg-emerald-500", type: "expense" as const, archived: false },
  ];
  const mockOnCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("only shows the archive icon in the header when there are archived lists (matching AccountManager UX)", async () => {
    const shoppingService = await import("@/services/shopping.service") as any;
    // Without archived lists
    shoppingService._setStoredLists([
      {
        id: "list-1",
        name: "Súper Activo",
        status: "active",
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { unmount } = render(
      <SettingsProvider>
        <ShoppingListManager
          accounts={mockAccounts}
          categories={mockCategories}
          onCheckout={mockOnCheckout}
        />
      </SettingsProvider>
    );

    // Archive button should NOT be visible when there are no archived lists
    expect(screen.queryByTitle("Ver listas archivadas")).toBeNull();
    unmount();

    // Now with an archived list
    shoppingService._setStoredLists([
      {
        id: "list-1",
        name: "Súper Activo",
        status: "active",
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "list-2",
        name: "Compras Pasadas",
        status: "archived",
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    render(
      <SettingsProvider>
        <ShoppingListManager
          accounts={mockAccounts}
          categories={mockCategories}
          onCheckout={mockOnCheckout}
        />
      </SettingsProvider>
    );

    // Archive button should now appear in the header
    const archiveBtn = screen.getByTitle("Ver listas archivadas");
    expect(archiveBtn).toBeDefined();

    // Clicking it navigates to the archived view
    fireEvent.click(archiveBtn);
    expect(await screen.findByText("Listas Archivadas")).toBeDefined();
    expect(await screen.findByText("Compras Pasadas")).toBeDefined();
  });

  it("allows deleting an empty list from the bottom action bar with confirmation", async () => {
    const shoppingService = await import("@/services/shopping.service") as any;
    const emptyList: ShoppingList = {
      id: "empty-list-1",
      name: "Lista Vacía Sin Artículos",
      status: "active",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    shoppingService._setStoredLists([emptyList]);

    render(
      <SettingsProvider>
        <ShoppingListManager
          accounts={mockAccounts}
          categories={mockCategories}
          onCheckout={mockOnCheckout}
        />
      </SettingsProvider>
    );

    // Open detail
    fireEvent.click(screen.getByText("Lista Vacía Sin Artículos"));

    // The delete button is present in the bottom bar even if empty!
    const deleteButton = await screen.findByTitle("Eliminar lista");
    expect(deleteButton).toBeDefined();

    // Click delete to open confirmation dialog
    fireEvent.click(deleteButton);

    // Verify confirmation dialog appears
    expect(await screen.findByText(/Eliminar.*Lista Vacía Sin Artículos/i)).toBeDefined();

    // Confirm deletion
    const confirmBtn = screen.getByRole("button", { name: /Eliminar definitivamente/i });
    fireEvent.click(confirmBtn);

    // Verify remote deletion was requested
    expect(shoppingService.deleteShoppingListRemote).toHaveBeenCalledWith("empty-list-1");
  });
});
