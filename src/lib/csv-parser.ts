import { Transaction, Category, CATEGORIES } from "./types";

export interface CsvRow {
  [key: string]: string;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  type: string; // column name, or "" if using sign detection
}

export function parseCsvText(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === "," || char === ";") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export function guessMapping(headers: string[]): ColumnMapping {
  const lower = headers.map(h => h.toLowerCase());

  const dateCol = headers[lower.findIndex(h => /date|fecha|data|vencimento/.test(h))] ?? headers[0];
  const descCol = headers[lower.findIndex(h => /desc|concepto|detalle|memo|narr/.test(h))] ?? headers[1];
  const amountCol = headers[lower.findIndex(h => /amount|monto|valor|importe|value/.test(h))] ?? headers[2];
  const typeCol = headers[lower.findIndex(h => /type|tipo|credit|debit/.test(h))] ?? "";

  return { date: dateCol, description: descCol, amount: amountCol, type: typeCol };
}

export function guessCategory(description: string): Category {
  const d = description.toLowerCase();
  if (/uber|lyft|taxi|bus|subte|metro|peaje/.test(d)) return CATEGORIES.find(c => c.id === "transport")!;
  if (/supermercado|grocery|walmart|carrefour|coto|market/.test(d)) return CATEGORIES.find(c => c.id === "groceries")!;
  if (/restaurant|restó|dinner|lunch|cafe|coffee|starbucks|mcdon/.test(d)) return CATEGORIES.find(c => c.id === "dining")!;
  if (/netflix|spotify|cine|cinema|game|steam/.test(d)) return CATEGORIES.find(c => c.id === "entertainment")!;
  if (/farmacia|pharmacy|hospital|doctor|salud/.test(d)) return CATEGORIES.find(c => c.id === "health")!;
  if (/amazon|mercadolibre|tienda|shop|zara/.test(d)) return CATEGORIES.find(c => c.id === "shopping")!;
  if (/luz|gas|agua|internet|telefon|electric|bill/.test(d)) return CATEGORIES.find(c => c.id === "bills")!;
  if (/sueldo|salary|salario|honorar/.test(d)) return CATEGORIES.find(c => c.id === "salary")!;
  if (/freelance|proyecto/.test(d)) return CATEGORIES.find(c => c.id === "freelance")!;
  return CATEGORIES.find(c => c.id === "other-expense")!;
}

export function parseAmount(raw: string): number {
  // Handle formats like "1.234,56" (ES/BR) or "1,234.56" (US) or "-$1234.56"
  let cleaned = raw.replace(/[$€£ARS\s]/gi, "");
  // If has comma as decimal sep (e.g., 1.234,56)
  if (/\d\.\d{3},\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  return Math.abs(parseFloat(cleaned) || 0);
}

export function isNegativeAmount(raw: string): boolean {
  const cleaned = raw.replace(/[$€£ARS\s]/gi, "");
  return cleaned.startsWith("-") || cleaned.startsWith("(");
}

export function parseDate(raw: string): Date {
  // Try common formats
  const trimmed = raw.trim();
  
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3]);
    return new Date(year, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
  }

  // YYYY-MM-DD
  const ymd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    return new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
  }

  // Fallback
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function rowsToTransactions(
  rows: CsvRow[],
  mapping: ColumnMapping,
  accountId: string
): Transaction[] {
  return rows.map((row, i) => {
    const rawAmount = row[mapping.amount] ?? "0";
    const amount = parseAmount(rawAmount);
    const desc = row[mapping.description] ?? "Imported";
    const date = parseDate(row[mapping.date] ?? "");
    
    let type: "income" | "expense";
    if (mapping.type && row[mapping.type]) {
      const tv = row[mapping.type].toLowerCase();
      type = /credit|income|ingreso|haber/.test(tv) ? "income" : "expense";
    } else {
      // Use sign: negative = expense, positive = income
      type = isNegativeAmount(rawAmount) ? "expense" : "income";
    }

    const category = type === "income"
      ? (guessCategory(desc).type === "income" ? guessCategory(desc) : CATEGORIES.find(c => c.id === "other-income")!)
      : guessCategory(desc);

    return {
      id: `import-${Date.now()}-${i}`,
      amount,
      description: desc,
      category,
      date,
      type,
      accountId,
    };
  });
}
