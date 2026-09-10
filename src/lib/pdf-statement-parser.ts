import * as pdfjsLib from "pdfjs-dist";
import { Transaction, Category, CATEGORIES, Currency } from "./types";
import { parseAmount, guessCategory, detectCardPayment, extractInstallmentInfo } from "./csv-parser";

// Configurar worker inline o fallback para entorno web Vite
if (typeof window !== "undefined" && "Worker" in window) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch {
    // Si falla URL constructor en Vite, usar CDN unpkg como fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
}

export interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  page: number;
}

export interface StatementMetadata {
  bankName: string;
  accountType: string;
  cardNumber?: string;
  closingDate?: Date;
  dueDate?: Date;
  totalPesos?: number;
  totalUsd?: number;
  minimumPayment?: number;
}

export interface ParsedPdfStatement {
  metadata: StatementMetadata;
  transactions: Transaction[];
  taxesAndFees: Transaction[];
  payments: Transaction[];
}

/**
 * Extrae texto con coordenadas de todas las páginas de un documento PDF
 */
export async function extractPdfTextItems(buffer: ArrayBuffer): Promise<ExtractedTextItem[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const items: ExtractedTextItem[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if ("str" in item && item.str.trim()) {
        const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
        items.push({
          str: item.str.trim(),
          x: Math.round(tx[4]),
          y: Math.round(tx[5]),
          page: pageNum,
        });
      }
    }
  }

  return items;
}

/**
 * Agrupa items de texto en líneas horizontales lógicas por proximidad de coordenada Y
 */
export function groupIntoLines(items: ExtractedTextItem[]): { lineText: string; page: number; y: number; tokens: string[] }[] {
  const linesMap = new Map<string, ExtractedTextItem[]>();

  for (const item of items) {
    // Tolerancia de 3 puntos en Y para la misma línea horizontal
    const roundedY = Math.round(item.y / 3) * 3;
    const key = `${item.page}-${roundedY}`;
    if (!linesMap.has(key)) {
      linesMap.set(key, []);
    }
    linesMap.get(key)!.push(item);
  }

  const result: { lineText: string; page: number; y: number; tokens: string[] }[] = [];

  for (const [key, lineItems] of linesMap.entries()) {
    const [pageStr, yStr] = key.split("-");
    const page = parseInt(pageStr, 10);
    const y = parseInt(yStr, 10);

    // Ordenar de izquierda a derecha por X
    lineItems.sort((a, b) => a.x - b.x);
    const tokens = lineItems.map((i) => i.str);
    const lineText = tokens.join(" ");

    result.push({ lineText, page, y, tokens });
  }

  // Ordenar de arriba hacia abajo (páginas ascendentes, Y descendente)
  result.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return b.y - a.y;
  });

  return result;
}

/**
 * Parser especializado para Resúmenes BBVA (Visa / Mastercard)
 */
export function parseBbvaCreditCardStatement(
  items: ExtractedTextItem[],
  accountId: string,
  categories: Category[] = CATEGORIES
): ParsedPdfStatement {
  const lines = groupIntoLines(items);
  const metadata: StatementMetadata = {
    bankName: "BBVA",
    accountType: "Tarjeta de Crédito",
  };

  const transactions: Transaction[] = [];
  const taxesAndFees: Transaction[] = [];
  const payments: Transaction[] = [];

  let currentSection: "header" | "payments" | "consumptions" | "taxes" | "other" = "header";

  // Regex para fecha de resumen: "20-Ago-26" o "03-Sep-26" o "20/08/26"
  const dateRegex = /(\d{1,2})[-/]([A-Za-z]{3}|\d{1,2})[-/](\d{2,4})/;

  const monthMap: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, set: 8, sep: 8, oct: 9, nov: 10, dic: 11,
  };

  function parseDateString(str: string): Date | null {
    const m = str.match(dateRegex);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    let month = 0;
    const monthStr = m[2].toLowerCase();
    if (monthMap[monthStr] !== undefined) {
      month = monthMap[monthStr];
    } else {
      month = parseInt(m[2], 10) - 1;
    }
    const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
    return new Date(year, month, day);
  }

  // Escanear metadatos generales (Cierre, Vto, etc.)
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].lineText;

    if (/visa platinum|visa gold|visa signature|mastercard/i.test(text)) {
      metadata.accountType = text.trim();
    }

    if (/cierre actual/i.test(text)) {
      // Buscar fecha en esta línea o siguientes tokens
      const match = text.match(dateRegex);
      if (match) metadata.closingDate = parseDateString(match[0]) || undefined;
    }

    if (/vencimiento actual/i.test(text)) {
      const match = text.match(dateRegex);
      if (match) metadata.dueDate = parseDateString(match[0]) || undefined;
    }

    if (/pago m[ií]nimo/i.test(text)) {
      const amountMatch = text.match(/\$\s*([\d\.,]+)/);
      if (amountMatch) metadata.minimumPayment = parseAmount(amountMatch[1]);
    }

    // Identificar cambios de sección en el extracto de BBVA
    if (/sus pagos y ajustes realizados/i.test(text)) {
      currentSection = "payments";
      continue;
    }

    if (/consumos/i.test(text) && !/total consumos/i.test(text)) {
      currentSection = "consumptions";
      continue;
    }

    if (/impuestos, cargos e intereses/i.test(text)) {
      currentSection = "taxes";
      continue;
    }

    if (/total consumos|saldo actual|legales y avisos/i.test(text)) {
      currentSection = "other";
    }

    // Parsear según sección
    if (currentSection === "payments") {
      // Formato: FECHA DESCRIPCIÓN NRO.CUPÓN PESOS DÓLARES
      // Ej: "31-Jul-26 SU PAGO EN PESOS -353.164,22"
      const dateMatch = text.match(dateRegex);
      if (dateMatch) {
        const txDate = parseDateString(dateMatch[0]) || new Date();
        const amounts = text.match(/-?[\d\.]+,\d{2}/g);
        if (amounts && amounts.length > 0) {
          const rawAmount = amounts[amounts.length - 1];
          const amount = parseAmount(rawAmount);
          const isUsd = text.includes("USD") || text.includes("TC1520");
          const desc = text.replace(dateRegex, "").replace(/-?[\d\.]+,\d{2}/g, "").trim();

          const paymentCat =
            categories.find((c) => /transfer|pago|tarjeta/i.test(c.name)) ||
            categories.find((c) => c.type === "income") ||
            categories[0] || {
              id: "uncategorized",
              name: "Transferencia",
              color: "bg-sky-500",
              type: "income" as const,
            };

          payments.push({
            id: `bbva-pay-${Date.now()}-${payments.length}`,
            amount,
            description: desc || "Pago de Tarjeta",
            category: paymentCat,
            date: txDate,
            type: "income", // o transferencia
            accountId,
            currency: (isUsd ? "USD" : "ARS") as Currency,
            isTransfer: true,
            isCardPayment: true,
          });
        }
      }
    } else if (currentSection === "consumptions") {
      // Formato: 20-Feb-26 MERPAGO*DXELECTRONICA C.06/06 600400 10.614,20
      // o: 24-Jul-26 APPLE.COM/BILL MVL9HQSLSUSD 2,99 726664 2,99 (USD)
      const dateMatch = text.match(dateRegex);
      if (dateMatch) {
        const txDate = parseDateString(dateMatch[0]) || metadata.closingDate || new Date();
        const amounts = text.match(/[\d\.]+,\d{2}/g);

        if (amounts && amounts.length > 0) {
          // Si el texto incluye mención a USD o viene en la columna dólares
          const isUsd = /usd|apple\.com|google|youtube/i.test(text);
          const rawAmount = amounts[amounts.length - 1];
          const amount = parseAmount(rawAmount);

          let desc = text.replace(dateRegex, "").replace(/[\d\.]+,\d{2}/g, "").replace(/\b\d{6}\b/g, "").trim();

          // Detección de cuotas
          let installmentInfo: { current: number; total: number; groupId: string } | undefined;
          const instInfo = extractInstallmentInfo(text);
          if (instInfo) {
            installmentInfo = {
              current: instInfo.current,
              total: instInfo.total,
              groupId: `bbva-${Date.now()}-${transactions.length}`,
            };
            desc = instInfo.cleanDescription;
          }

          transactions.push({
            id: `bbva-tx-${Date.now()}-${transactions.length}`,
            amount,
            description: desc,
            category: guessCategory(desc, categories),
            date: txDate,
            type: "expense",
            accountId,
            currency: (isUsd ? "USD" : "ARS") as Currency,
            installmentInfo,
          });
        }
      }
    } else if (currentSection === "taxes") {
      // Formato: 20-Ago-26 IMPUESTO DE SELLOS $ 6.411,30
      // 20-Ago-26 IVA RG 4240 21%( 14940,06) 3.137,41
      const dateMatch = text.match(dateRegex);
      if (dateMatch) {
        const txDate = parseDateString(dateMatch[0]) || metadata.closingDate || new Date();
        const amounts = text.match(/[\d\.]+,\d{2}/g);

        if (amounts && amounts.length > 0) {
          const rawAmount = amounts[amounts.length - 1];
          const amount = parseAmount(rawAmount);
          const desc = text.replace(dateRegex, "").replace(/[\d\.]+,\d{2}/g, "").trim();

          const billsCategory =
            categories.find((c) => /impuesto|servicios|bills|cargos/i.test(c.name)) ||
            categories.find((c) => c.type === "expense") ||
            categories[0] || {
              id: "uncategorized",
              name: "Impuestos y Servicios",
              color: "bg-red-400",
              type: "expense" as const,
            };

          taxesAndFees.push({
            id: `bbva-tax-${Date.now()}-${taxesAndFees.length}`,
            amount,
            description: desc,
            category: billsCategory,
            date: txDate,
            type: "expense",
            accountId,
            currency: "ARS",
          });
        }
      }
    }
  }

  return {
    metadata,
    transactions,
    taxesAndFees,
    payments,
  };
}
