export interface ExtractedWhatsAppExpense {
  amount: number;
  currency: "ARS" | "USD";
  description: string;
  categoryHint: string;
  accountHint?: string;
  type: "expense" | "income";
  isTransfer?: boolean;
  installmentInfo?: {
    current: number;
    total: number;
  };
  date: string;
  confidence: number;
}

/**
 * Parser heurístico y semántico que extrae datos financieros de mensajes en español
 * Funciona como motor local inmediato o fallback si no hay API key de Gemini configurada.
 */
export function parseFinancialMessageHeuristic(text: string): ExtractedWhatsAppExpense | null {
  const clean = text.trim();
  if (!clean) return null;

  // 1. Extraer Monto: patrones como "$14.500", "14500", "$ 14500,50", "14.500,50"
  const amountRegex = /(?:\$|\bars|\busd)?\s*([0-9]+(?:[.,][0-9]+)*)/i;
  const amountMatch = clean.match(amountRegex);
  if (!amountMatch) return null;

  let rawAmount = amountMatch[1].trim();
  if (rawAmount.includes(".") && rawAmount.includes(",")) {
    // Formato argentino: 1.500,50 -> 1500.50
    rawAmount = rawAmount.replace(/\./g, "").replace(",", ".");
  } else if (rawAmount.includes(",")) {
    // Coma decimal: 1500,50 -> 1500.50
    rawAmount = rawAmount.replace(",", ".");
  } else if (rawAmount.includes(".")) {
    // Si tiene un solo punto y 3 dígitos después, asumimos separador de miles: 14.500 -> 14500
    const parts = rawAmount.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      rawAmount = parts[0] + parts[1];
    }
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) return null;

  const lower = clean.toLowerCase();

  // 2. Tipo (Gasto vs Ingreso vs Transferencia)
  let type: "expense" | "income" = "expense";
  let isTransfer = false;
  if (
    lower.includes("ingreso") ||
    lower.includes("cobre") ||
    lower.includes("cobré") ||
    lower.includes("sueldo") ||
    lower.includes("deposito") ||
    lower.includes("depósito") ||
    lower.includes("honorarios")
  ) {
    type = "income";
  } else if (lower.includes("transferi") || lower.includes("transferí") || lower.includes("transferencia")) {
    isTransfer = true;
  }

  // 3. Moneda
  const currency: "ARS" | "USD" = lower.includes("usd") || lower.includes("dolar") || lower.includes("dólar") ? "USD" : "ARS";

  // 4. Cuenta sugerida (bancos / billeteras frecuentes)
  let accountHint: string | undefined = undefined;
  if (lower.includes("mercado pago") || lower.includes("mercadopago") || lower.includes(" mp")) {
    accountHint = "Mercado Pago";
  } else if (lower.includes("galicia")) {
    accountHint = "Banco Galicia";
  } else if (lower.includes("santander")) {
    accountHint = "Banco Santander";
  } else if (lower.includes("bbva") || lower.includes("frances")) {
    accountHint = "BBVA";
  } else if (lower.includes("brubank")) {
    accountHint = "Brubank";
  } else if (lower.includes("efectivo") || lower.includes("cash")) {
    accountHint = "Efectivo";
  }

  // 5. Categoría sugerida & concepto
  let categoryHint = "Otros";
  if (
    lower.includes("super") ||
    lower.includes("coto") ||
    lower.includes("carrefour") ||
    lower.includes("dia") ||
    lower.includes("día") ||
    lower.includes("jumbo") ||
    lower.includes("chino") ||
    lower.includes("verduleria") ||
    lower.includes("carniceria")
  ) {
    categoryHint = "Supermercado";
  } else if (
    lower.includes("cena") ||
    lower.includes("almuerzo") ||
    lower.includes("mostaza") ||
    lower.includes("mcdonald") ||
    lower.includes("burger") ||
    lower.includes("cafe") ||
    lower.includes("café") ||
    lower.includes("bar") ||
    lower.includes("rappi") ||
    lower.includes("pedidosya")
  ) {
    categoryHint = "Restaurantes";
  } else if (
    lower.includes("farmacia") ||
    lower.includes("remedio") ||
    lower.includes("medico") ||
    lower.includes("médico") ||
    lower.includes("consulta")
  ) {
    categoryHint = "Salud";
  } else if (
    lower.includes("nafta") ||
    lower.includes("ypf") ||
    lower.includes("shell") ||
    lower.includes("uber") ||
    lower.includes("cabify") ||
    lower.includes("sube") ||
    lower.includes("peaje")
  ) {
    categoryHint = "Transporte";
  } else if (
    lower.includes("luz") ||
    lower.includes("gas") ||
    lower.includes("edenor") ||
    lower.includes("metrogas") ||
    lower.includes("internet") ||
    lower.includes("fibertel") ||
    lower.includes("expensas")
  ) {
    categoryHint = "Servicios";
  }

  // 6. Detección de cuotas ("en 3 cuotas", "6 cuotas", "3x")
  let installmentInfo: { current: number; total: number } | undefined = undefined;
  const installmentMatch = lower.match(/(?:en\s+)?(\d{1,2})\s*cuotas?/i);
  if (installmentMatch) {
    const count = parseInt(installmentMatch[1], 10);
    if (count > 1 && count <= 36) {
      installmentInfo = { current: 1, total: count };
    }
  }

  // 7. Limpiar descripción removiendo palabras auxiliares
  let description = clean
    .replace(/(?:gast[eé]|pagu[eé]|compr[eé]|cobr[eé]|ingreso|transfer[ií])\s*/gi, "")
    .replace(/(?:con|en|de|por)?\s*(?:mercado\s*pago|mp|galicia|santander|bbva|efectivo|cash)\b/gi, "")
    .replace(/(?:en\s+)?\d{1,2}\s*cuotas?/gi, "")
    .replace(/(?:\$|\bars|\busd)?\s*[0-9]+(?:[.,][0-9]+)*/gi, "")
    .replace(/^(?:en|de|con|por)\s+/i, "")
    .trim();

  // Si quedó vacía la descripción, usar la categoría
  if (!description || description.length < 2) {
    description = categoryHint !== "Otros" ? categoryHint : "Gasto sin detalle";
  } else {
    // Capitalizar primera letra
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return {
    amount,
    currency,
    description,
    categoryHint,
    accountHint,
    type,
    isTransfer,
    installmentInfo,
    date: new Date().toISOString(),
    confidence: 0.85,
  };
}
