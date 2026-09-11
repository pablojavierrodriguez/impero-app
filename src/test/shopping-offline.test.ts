import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredShoppingLists,
  saveStoredShoppingLists,
  getPendingShoppingSyncCount,
  SHOPPING_CACHE_KEY,
  SHOPPING_QUEUE_KEY,
  createShoppingList,
  updateShoppingListRemote,
  deleteShoppingListRemote,
  createShoppingListItemRemote,
  updateShoppingListItemRemote,
  deleteShoppingListItemRemote,
  syncPendingShoppingQueue,
} from "@/services/shopping.service";
import { ShoppingList } from "@/lib/types";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    eq: vi.fn().mockRejectedValue(new Error("Network Error - Simulated Offline")),
    single: vi.fn().mockRejectedValue(new Error("Network Error - Simulated Offline")),
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockRejectedValue(new Error("Network Error - Simulated Offline")),
      },
      from: vi.fn().mockReturnValue(queryBuilder),
    },
  };
});

describe("P20: Resiliencia Offline-First en Shopping List", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("loads and persists shopping lists in localStorage", () => {
    const mockLists: ShoppingList[] = [
      {
        id: "list-1",
        name: "Supermercado Mensual",
        status: "active",
        targetAccountId: null,
        targetCategoryId: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    saveStoredShoppingLists(mockLists);
    const retrieved = getStoredShoppingLists();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].name).toBe("Supermercado Mensual");
  });

  it("handles offline createShoppingList by caching locally and queueing sync operation", async () => {
    expect(getPendingShoppingSyncCount()).toBe(0);

    const created = await createShoppingList("Compras Verdulería");
    expect(created.name).toBe("Compras Verdulería");
    expect(created.id).toBeDefined();

    // Verifies it was saved in localStorage cache
    const cached = getStoredShoppingLists();
    expect(cached).toHaveLength(1);
    expect(cached[0].name).toBe("Compras Verdulería");

    // Verifies it was added to the offline sync queue
    expect(getPendingShoppingSyncCount()).toBe(1);
    const queue = JSON.parse(localStorage.getItem(SHOPPING_QUEUE_KEY) || "[]");
    expect(queue[0].type).toBe("create_list");
    expect(queue[0].payload.name).toBe("Compras Verdulería");
  });

  it("handles offline item creation by updating cache and queueing operation", async () => {
    // Seed list in cache
    const list: ShoppingList = {
      id: "list-100",
      name: "Farmacia",
      status: "active",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    saveStoredShoppingLists([list]);

    const item = await createShoppingListItemRemote({
      listId: "list-100",
      name: "Ibuprofeno",
      quantity: 2,
      unitPrice: 3500,
      isChecked: false,
      sortOrder: 0,
    });

    expect(item.name).toBe("Ibuprofeno");
    expect(item.quantity).toBe(2);

    // List in cache should now contain the item
    const updatedCache = getStoredShoppingLists();
    expect(updatedCache[0].items).toHaveLength(1);
    expect(updatedCache[0].items[0].name).toBe("Ibuprofeno");

    // Operation was queued
    expect(getPendingShoppingSyncCount()).toBe(1);
    const queue = JSON.parse(localStorage.getItem(SHOPPING_QUEUE_KEY) || "[]");
    expect(queue[0].type).toBe("create_item");
    expect(queue[0].payload.name).toBe("Ibuprofeno");
  });

  it("handles offline item toggle/update and deletion", async () => {
    const list: ShoppingList = {
      id: "list-200",
      name: "Almacén",
      status: "active",
      items: [
        {
          id: "item-1",
          listId: "list-200",
          name: "Leche",
          quantity: 3,
          unitPrice: 1200,
          isChecked: false,
          sortOrder: 0,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    saveStoredShoppingLists([list]);

    // Update item
    await updateShoppingListItemRemote("item-1", { isChecked: true });
    let cached = getStoredShoppingLists();
    expect(cached[0].items[0].isChecked).toBe(true);
    expect(getPendingShoppingSyncCount()).toBe(1);

    // Delete item
    await deleteShoppingListItemRemote("item-1");
    cached = getStoredShoppingLists();
    expect(cached[0].items).toHaveLength(0);
    expect(getPendingShoppingSyncCount()).toBe(2);
  });
});
