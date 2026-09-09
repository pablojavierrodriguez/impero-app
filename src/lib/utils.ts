import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parsea un string de fecha tipo "yyyy-MM-dd" (de un input type="date") como
 * fecha LOCAL, evitando el bug de timezone donde `new Date("2026-09-15")`
 * se interpreta como UTC midnight y en zonas UTC- aparece como el día anterior.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon local = sin ambigüedad de TZ
}

/**
 * Formatea un valor numérico o string crudo en formato argentino/hispano:
 * Miles con punto (.) y decimales con coma (,).
 * Ej: "5000000" -> "5.000.000", "5000000.5" -> "5.000.000,5"
 */
export function formatThousandsInput(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  
  if (typeof value === "number") {
    const parts = value.toString().split(".");
    const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (parts.length > 1) {
      return `${formattedInteger},${parts[1].slice(0, 2)}`;
    }
    return formattedInteger;
  }

  const str = value;
  // En formato es-AR, la coma (",") es el separador decimal y el punto (".") es de miles.
  // Si el usuario escribe un punto al final (ej. "170."), interpretamos que busca ingresar decimales.
  let normalized = str;
  if (!str.includes(",") && str.endsWith(".")) {
    normalized = str.slice(0, -1) + ",";
  }

  const hasComma = normalized.includes(",");
  const parts = normalized.split(",");

  // La parte entera toma solo los dígitos (ignora los puntos de miles ya existentes al re-formatear)
  const integerPart = parts[0].replace(/\D/g, "");
  if (!integerPart && !hasComma) return "";

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (hasComma) {
    const decimalPart = (parts[1] || "").replace(/\D/g, "").slice(0, 2);
    return `${formattedInteger || "0"},${decimalPart}`;
  }

  return formattedInteger;
}

/**
 * Parsea un string formateado ("5.000.000,50" o "5000000") a valor numérico puro.
 */
export function parseThousandsInput(value: string): number {
  if (!value) return 0;
  // Quitar puntos de miles y reemplazar coma decimal por punto
  const cleaned = value.replace(/\./g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

