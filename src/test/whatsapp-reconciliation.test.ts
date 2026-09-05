import { describe, it, expect } from "vitest";
import {
  WhatsAppExtractedExpenseSchema,
  normalizeText,
  matchCategory,
  matchAccount,
  reconcileExpenseWithUserEntities,
} from "@/lib/whatsapp-reconciliation";
import { Category, Account } from "@/lib/types";

describe("WhatsApp Reconciliation & LLM Schemas", () => {
  const mockCategories: Category[] = [
    { id: "cat-1", name: "Supermercado", color: "green", type: "expense" },
    { id: "cat-2", name: "Restaurantes", color: "orange", type: "expense" },
    { id: "cat-3", name: "Farmacia & Salud", color: "blue", type: "expense" },
    { id: "cat-4", name: "Otros Gastos", color: "gray", type: "expense" },
  ];

  const mockAccounts: Account[] = [
    { id: "acc-1", name: "Mercado Pago", balance: 50000, type: "checking", color: "blue" },
    { id: "acc-2", name: "Banco Galicia Débito", balance: 120000, type: "checking", color: "orange" },
    { id: "acc-3", name: "Efectivo", balance: 15000, type: "cash", color: "green" },
  ];

  it("valida y parsea el schema Zod con valores válidos", () => {
    const rawData = {
      amount: 8500,
      currency: "ARS",
      description: "Cena en Mostaza",
      categoryHint: "Restaurantes",
      accountHint: "MP",
      type: "expense",
      date: "2026-09-04T20:00:00.000Z",
    };

    const parsed = WhatsAppExtractedExpenseSchema.parse(rawData);
    expect(parsed.amount).toBe(8500);
    expect(parsed.description).toBe("Cena en Mostaza");
    expect(parsed.currency).toBe("ARS");
  });

  it("normaliza texto eliminando acentos y mayúsculas", () => {
    expect(normalizeText("Farmacia & Atención")).toBe("farmacia & atencion");
  });

  it("reconcilia categorías por coincidencia exacta y parcial", () => {
    const matchedExact = matchCategory("Supermercado", mockCategories);
    expect(matchedExact.id).toBe("cat-1");

    const matchedPartial = matchCategory("farmacia", mockCategories);
    expect(matchedPartial.id).toBe("cat-3");

    const fallback = matchCategory("Gastos raros no clasificados", mockCategories);
    expect(fallback.name).toBe("Otros Gastos");
  });

  it("reconcilia cuentas utilizando alias y sinónimos comunes de LatAm", () => {
    const matchMp = matchAccount("mp", mockAccounts);
    expect(matchMp.id).toBe("acc-1");

    const matchGali = matchAccount("galicia", mockAccounts);
    expect(matchGali.id).toBe("acc-2");

    const matchCash = matchAccount("plata en mano", mockAccounts);
    expect(matchCash.id).toBe("acc-3");
  });

  it("genera la entidad reconciliada completa para insertar en Supabase", () => {
    const extracted = {
      amount: 14200,
      currency: "ARS" as const,
      description: "Carrefour Express",
      categoryHint: "Supermercado",
      accountHint: "Galicia",
      type: "expense" as const,
      isTransfer: false,
      date: "2026-09-04T12:00:00.000Z",
      confidence: 0.95,
      installmentInfo: { current: 1, total: 3 },
    };

    const reconciled = reconcileExpenseWithUserEntities(extracted, mockCategories, mockAccounts);
    expect(reconciled.amount).toBe(14200);
    expect(reconciled.categoryId).toBe("cat-1");
    expect(reconciled.accountId).toBe("acc-2");
    expect(reconciled.installmentInfo?.total).toBe(3);
    expect(reconciled.installmentInfo?.groupId).toMatch(/^wa-/);
  });
});
