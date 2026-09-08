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
