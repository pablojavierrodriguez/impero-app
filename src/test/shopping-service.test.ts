import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchShoppingLists,
  createShoppingList,
  updateShoppingListRemote,
  deleteShoppingListRemote,
  createShoppingListItemRemote,
  updateShoppingListItemRemote,
  deleteShoppingListItemRemote,
} from "@/services/shopping.service";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => {
  const mockFrom = vi.fn();
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
  };
  return {
    supabase: {
      from: mockFrom,
      auth: mockAuth,
    },
  };
});

describe("Shopping Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches shopping lists and joins their items correctly", async () => {
    const listsData = [
      {
        id: "list-1",
        user_id: "user-123",
        name: "Supermercado Semanal",
        status: "active",
        target_account_id: "acc-1",
        target_category_id: "cat-1",
        created_at: "2026-09-10T10:00:00Z",
        updated_at: "2026-09-10T10:00:00Z",
      },
    ];

    const itemsData = [
      {
        id: "item-1",
        list_id: "list-1",
        name: "Leche",
        quantity: 2,
        unit_price: 1500,
        is_checked: true,
        sort_order: 0,
        created_at: "2026-09-10T10:05:00Z",
      },
    ];

    const mockListsSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: listsData, error: null }),
    });

    const mockItemsSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: itemsData, error: null }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "shopping_lists") {
        return { select: mockListsSelect } as any;
      }
      if (table === "shopping_list_items") {
        return { select: mockItemsSelect } as any;
      }
      return {} as any;
    });

    const result = await fetchShoppingLists();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("list-1");
    expect(result[0].name).toBe("Supermercado Semanal");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].name).toBe("Leche");
    expect(result[0].items[0].isChecked).toBe(true);
  });

  it("creates a new shopping list with current user", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "list-new",
            user_id: "user-123",
            name: "Ferretería",
            status: "active",
            target_account_id: null,
            target_category_id: null,
            created_at: "2026-09-10T12:00:00Z",
            updated_at: "2026-09-10T12:00:00Z",
          },
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    const created = await createShoppingList("Ferretería");
    expect(created.id).toBe("list-new");
    expect(created.name).toBe("Ferretería");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      name: "Ferretería",
      status: "active",
      target_account_id: null,
      target_category_id: null,
    });
  });

  it("updates and deletes shopping items", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      delete: mockDelete,
    } as any);

    await updateShoppingListItemRemote("item-1", { isChecked: true });
    expect(mockUpdate).toHaveBeenCalledWith({ is_checked: true });

    await deleteShoppingListItemRemote("item-1");
    expect(mockDelete).toHaveBeenCalled();
  });
});
