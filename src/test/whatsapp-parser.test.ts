import { describe, it, expect } from "vitest";
import { parseFinancialMessageHeuristic } from "@/lib/whatsapp-parser";

describe("WhatsApp Financial Message Parser (Heuristics & Argentine Slang)", () => {
  it("correctly parses a standard expense with merchant and bank", () => {
    const result = parseFinancialMessageHeuristic("Gasté 14500 en Coto con Galicia");
    expect(result).not.toBeNull();
    expect(result?.amount).toBe(14500);
    expect(result?.type).toBe("expense");
    expect(result?.accountHint).toBe("Banco Galicia");
    expect(result?.categoryHint).toBe("Supermercado");
    expect(result?.description).toContain("Coto");
  });

  it("parses argentinian thousand dot and comma formats", () => {
    const res1 = parseFinancialMessageHeuristic("Pagué $ 2.500,50 farmacia");
    expect(res1?.amount).toBe(2500.5);
    expect(res1?.categoryHint).toBe("Salud");

    const res2 = parseFinancialMessageHeuristic("Supermercado dia 15.000");
    expect(res2?.amount).toBe(15000);
    expect(res2?.categoryHint).toBe("Supermercado");
  });

  it("identifies income and payment types", () => {
    const result = parseFinancialMessageHeuristic("Cobré honorarios $150000 Santander");
    expect(result?.amount).toBe(150000);
    expect(result?.type).toBe("income");
    expect(result?.accountHint).toBe("Banco Santander");
  });

  it("detects installments in credit purchases", () => {
    const result = parseFinancialMessageHeuristic("Zapatillas 45000 en 3 cuotas con Galicia");
    expect(result?.amount).toBe(45000);
    expect(result?.accountHint).toBe("Banco Galicia");
    expect(result?.installmentInfo).toEqual({ current: 1, total: 3 });
  });

  it("returns null for non-financial or invalid messages", () => {
    const result = parseFinancialMessageHeuristic("Hola como estás");
    expect(result).toBeNull();
  });
});
