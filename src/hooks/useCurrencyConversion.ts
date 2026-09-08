import { useMemo, useCallback } from "react";
import { useSettings, Currency, CURRENCIES, DEFAULT_EXCHANGE_RATES } from "@/lib/settings-store";
import { Account } from "@/lib/types";

export interface CurrencyConversionResult {
  /** Convierte un monto de una moneda de origen a una moneda destino */
  convert: (amount: number, from: Currency, to: Currency) => number;
  /** Formatea un monto con el símbolo de una moneda específica */
  formatInCurrency: (amount: number, currency: Currency, opts?: { sign?: string; abs?: boolean }) => string;
  /** Calcula el balance total consolidado de una lista de cuentas en una divisa objetivo */
  calculateConsolidatedBalance: (accounts: Account[], targetCurrency: Currency) => number;
  /** Calcula el total consolidado de una lista de transacciones en una divisa objetivo */
  calculateConsolidatedTransactions: (
    transactions: { amount: number; currency?: Currency; accountId: string }[],
    targetCurrency: Currency,
    accountsMap?: Map<string, Account>
  ) => number;
  /** Retorna el símbolo de la moneda */
  getCurrencySymbol: (currency: Currency) => string;
}

export function useCurrencyConversion(): CurrencyConversionResult {
  const { exchangeRates, settings } = useSettings();

  const rates = useMemo(() => {
    return {
      ...DEFAULT_EXCHANGE_RATES,
      ...(exchangeRates || {}),
      ...(settings.customExchangeRates || {}),
    };
  }, [settings.customExchangeRates, exchangeRates]);

  const convert = useCallback(
    (amount: number, from: Currency, to: Currency): number => {
      if (from === to) return amount;

      // Las tasas están expresadas como: 1 ARS = rate[CURRENCY] (ej: 1 ARS = 1/1200 USD)
      // Por tanto, monto en ARS = amount / rate[from]
      const rateFrom = rates[from] ?? 1;
      const rateTo = rates[to] ?? 1;

      const amountInArs = rateFrom > 0 ? amount / rateFrom : amount;
      return amountInArs * rateTo;
    },
    [rates]
  );

  const getCurrencySymbol = useCallback((currency: Currency): string => {
    return CURRENCIES.find((c) => c.value === currency)?.symbol ?? "$";
  }, []);

  const formatInCurrency = useCallback(
    (amount: number, currency: Currency, opts?: { sign?: string; abs?: boolean }): string => {
      const sym = getCurrencySymbol(currency);
      const val = opts?.abs ? Math.abs(amount) : amount;
      // En divisas extranjeras (USD / EUR) siempre mostrar al menos 2 decimales para evitar pérdida de precisión
      const forceDecimals = currency !== "ARS";
      const showDec = forceDecimals || settings.showDecimals;
      const formatted = Math.abs(val).toLocaleString("es-AR", {
        minimumFractionDigits: showDec ? 2 : 0,
        maximumFractionDigits: showDec ? 2 : 0,
      });
      const sign = opts?.sign ?? (val < 0 ? "-" : "");
      return `${sign}${sym}${formatted}`;
    },
    [getCurrencySymbol, settings.showDecimals]
  );

  const calculateConsolidatedBalance = useCallback(
    (accounts: Account[], targetCurrency: Currency): number => {
      return accounts.reduce((acc, account) => {
        if (account.archived) return acc;
        const accCurrency = (account.currency as Currency) || "ARS";
        const converted = convert(account.balance, accCurrency, targetCurrency);
        return acc + converted;
      }, 0);
    },
    [convert]
  );

  const calculateConsolidatedTransactions = useCallback(
    (
      txs: { amount: number; currency?: Currency; accountId: string }[],
      targetCurrency: Currency,
      accountsMap?: Map<string, Account>
    ): number => {
      return txs.reduce((sum, tx) => {
        const txCurrency = tx.currency || (accountsMap?.get(tx.accountId)?.currency as Currency) || "ARS";
        const converted = convert(tx.amount, txCurrency, targetCurrency);
        return sum + converted;
      }, 0);
    },
    [convert]
  );

  return {
    convert,
    formatInCurrency,
    calculateConsolidatedBalance,
    calculateConsolidatedTransactions,
    getCurrencySymbol,
  };
}
