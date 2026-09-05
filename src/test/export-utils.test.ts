import { describe, it, expect } from "vitest";
import { escapeCsvField, generateTransactionsCsv } from "../lib/export-utils";
import { Transaction } from "../lib/types";

describe("export-utils", () => {
  it("escapes fields with commas, quotes, or newlines correctly", () => {
    expect(escapeCsvField("Supermercado, Coto")).toBe('"Supermercado, Coto"');
    expect(escapeCsvField('Compra con "descuento"')).toBe('"Compra con ""descuento"""');
    expect(escapeCsvField("Línea 1\nLínea 2")).toBe('"Línea 1\nLínea 2"');
    expect(escapeCsvField(12500)).toBe("12500");
    expect(escapeCsvField("Normal")).toBe("Normal");
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("generates CSV content with UTF-8 BOM and correct headers and rows", () => {
    const mockTransactions: Transaction[] = [
      {
        id: "tx-1",
        amount: 3500.5,
        description: "Almuerzo en restaurante, microcentro",
        category: { id: "cat-1", name: "Comida & Restaurantes", icon: "Utensils", color: "bg-emerald-500", type: "expense" },
        date: new Date(2026, 8, 4),
        type: "expense",
        accountId: "acc-1",
        tags: ["salida", "amigos"],
        note: 'Nota con "comillas"',
      },
      {
        id: "tx-2",
        amount: 250000,
        description: "Sueldo mensual",
        category: { id: "cat-2", name: "Sueldo", icon: "Briefcase", color: "bg-emerald-500", type: "income" },
        date: new Date(2026, 8, 1),
        type: "income",
        accountId: "acc-2",
        installmentInfo: { current: 1, total: 3, groupId: "g-1" },
      },
    ];

    const accountsMap = {
      "acc-1": "Banco Galicia",
      "acc-2": "Mercado Pago",
    };

    const csv = generateTransactionsCsv(mockTransactions, accountsMap);

    // Debe empezar con UTF-8 BOM (\uFEFF)
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const lines = csv.replace("\uFEFF", "").split("\r\n");
    expect(lines.length).toBe(3); // Cabecera + 2 filas

    // Cabecera
    expect(lines[0]).toBe("Fecha,Tipo,Descripción,Categoría,Monto,Cuenta,Es Transferencia,Pago Tarjeta,Cuota,Notas,Etiquetas");

    // Primera fila
    expect(lines[1]).toContain("2026-09-04");
    expect(lines[1]).toContain("Gasto");
    expect(lines[1]).toContain('"Almuerzo en restaurante, microcentro"');
    expect(lines[1]).toContain("Comida & Restaurantes");
    expect(lines[1]).toContain("3500.5");
    expect(lines[1]).toContain("Banco Galicia");
    expect(lines[1]).toContain('"Nota con ""comillas"""');
    expect(lines[1]).toContain("salida; amigos");

    // Segunda fila
    expect(lines[2]).toContain("2026-09-01");
    expect(lines[2]).toContain("Ingreso");
    expect(lines[2]).toContain("Sueldo mensual");
    expect(lines[2]).toContain("Mercado Pago");
    expect(lines[2]).toContain("1/3");
  });
});
