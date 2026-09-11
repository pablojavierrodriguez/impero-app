import * as XLSX from "xlsx";
import { CsvRow } from "./csv-parser";

export interface ParsedExcelSheet {
  sheetName: string;
  headers: string[];
  rows: CsvRow[];
  metadata?: {
    accountInfo?: string;
    detectedType?: "bbva" | "generic_card" | "generic";
    accountNumber?: string;
    accountType?: "savings" | "checking" | "credit";
  };
}

/**
 * Normaliza y limpia celdas que puedan venir como fechas de Excel, números o strings
 */
function formatCellValue(cell: any): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) {
    const day = String(cell.getDate()).padStart(2, "0");
    const month = String(cell.getMonth() + 1).padStart(2, "0");
    const year = cell.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(cell).trim();
}

/**
 * Parsea un buffer binario de Excel (.xls o .xlsx)
 */
export function parseExcelBuffer(buffer: ArrayBuffer): ParsedExcelSheet[] {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    raw: false,
    dateNF: "dd/mm/yyyy",
  });

  const results: ParsedExcelSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convertir hoja a matriz bidimensional cruda
    const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (rawData.length === 0) continue;

    let accountInfo = "";
    let accountNumber = "";
    let detectedAccountType: "savings" | "checking" | "credit" | undefined;
    let headerRowIdx = -1;
    let detectedType: "bbva" | "generic_card" | "generic" = "generic";

    // 1. Escanear primeras 15 filas para detectar metadatos y la fila de encabezados real
    for (let i = 0; i < Math.min(rawData.length, 15); i++) {
      const row = rawData[i];
      if (!Array.isArray(row)) continue;

      const rowText = row.map(formatCellValue).join(" ").toLowerCase();

      // Extracción de número de cuenta si existe (ej: 339-630726/9)
      const accMatch = rowText.match(/\b(\d{3}[-\s]\d{5,8}[\/\-]?\d?)\b/);
      if (accMatch && !accountNumber) {
        accountNumber = accMatch[1].replace(/\s/g, "-");
      }

      if (rowText.includes("ca$") || rowText.includes("caja de ahorro") || rowText.includes("ca ")) {
        detectedAccountType = "savings";
      } else if (rowText.includes("cc$") || rowText.includes("cuenta corriente")) {
        detectedAccountType = "checking";
      }

      // Chequeo de BBVA (ej: "detalle de movimientos de cuenta: ca$ 339-630726/9" o mención a BBVA / Datanet)
      if (
        rowText.includes("bbva") ||
        (rowText.includes("detalle de movimientos") && (rowText.includes("ca$") || rowText.includes("339-") || rowText.includes("datanet")))
      ) {
        accountInfo = row.map(formatCellValue).filter(Boolean).join(" ");
        detectedType = "bbva";
      }

      // Chequeo de Tarjeta con cuotas (ej: "últimos movimientos", "cuota", "movimientos")
      if (rowText.includes("últimos movimientos") || (rowText.includes("movimientos") && rowText.includes("cuota"))) {
        detectedType = "generic_card";
      }

      // Detectar fila de encabezados buscando combinación de keywords
      const hasDate = row.some((c) => /fecha|date/i.test(formatCellValue(c)));
      const hasConceptOrDesc = row.some((c) => /concepto|movimiento|descripci[oó]n|detalle/i.test(formatCellValue(c)));
      const hasAmountOrDebit = row.some((c) => /importe|monto|amount|d[eé]bito|saldo/i.test(formatCellValue(c)));

      if (hasDate && (hasConceptOrDesc || hasAmountOrDebit)) {
        headerRowIdx = i;
        break;
      }
    }

    // Fallback: si no encontró header por keywords, tomar la primera fila no vacía con al menos 2 celdas
    if (headerRowIdx === -1) {
      for (let i = 0; i < rawData.length; i++) {
        const nonEmpty = rawData[i].filter((c: any) => formatCellValue(c) !== "");
        if (nonEmpty.length >= 2) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (headerRowIdx === -1 || headerRowIdx >= rawData.length - 1) {
      continue;
    }

    // Construir headers únicos y normalizados
    const rawHeaders = rawData[headerRowIdx].map(formatCellValue);
    const seenHeaders = new Map<string, number>();
    const headers = rawHeaders.map((h: string, idx: number) => {
      let name = h.trim();
      if (!name) name = `Columna_${idx + 1}`;
      const count = seenHeaders.get(name) || 0;
      seenHeaders.set(name, count + 1);
      return count === 0 ? name : `${name}_${count + 1}`;
    });

    // Construir rows
    const rows: CsvRow[] = [];
    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const rowArr = rawData[i];
      if (!Array.isArray(rowArr)) continue;

      // Ignorar filas totalmente vacías
      const hasContent = rowArr.some((c) => formatCellValue(c) !== "");
      if (!hasContent) continue;

      const rowObj: CsvRow = {};
      let validCells = 0;

      headers.forEach((headerName: string, colIdx: number) => {
        const val = formatCellValue(rowArr[colIdx]);
        if (val) validCells++;
        rowObj[headerName] = val;
      });

      // Si tiene al menos una celda con fecha o número relevante, la sumamos
      if (validCells >= 2) {
        rows.push(rowObj);
      }
    }

    results.push({
      sheetName,
      headers,
      rows,
      metadata: {
        accountInfo,
        detectedType,
        accountNumber,
        accountType: detectedAccountType,
      },
    });
  }

  return results;
}
