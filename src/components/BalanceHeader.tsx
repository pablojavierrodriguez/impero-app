import { useMemo, useCallback } from "react";
import { Eye, EyeOff, Globe } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { Currency, CURRENCIES } from "@/lib/settings-types";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { Account } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";

interface BalanceHeaderProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accounts?: Account[];
}

const HIDDEN = "$ ••••••";

export function BalanceHeader({ totalBalance, monthlyIncome, monthlyExpenses, accounts = [] }: BalanceHeaderProps) {
  const { settings, updateSettings, t } = useSettings();
  const { calculateConsolidatedBalance, formatInCurrency, convert, getCurrencySymbol } = useCurrencyConversion();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  // Moneda activa de consolidación (ARS, USD, EUR)
  const currentCurrency = settings.currency || "ARS";

  // Balance patrimonial consolidado según las divisas nativas de cada cuenta
  const effectiveTotal = useMemo(() => {
    if (accounts.length > 0) {
      return calculateConsolidatedBalance(accounts, currentCurrency);
    }
    // Fallback: si no se pasan cuentas, convertir el total directo
    return convert(totalBalance, "ARS", currentCurrency);
  }, [accounts, calculateConsolidatedBalance, currentCurrency, convert, totalBalance]);

  const effectiveIncome = useMemo(() => convert(monthlyIncome, "ARS", currentCurrency), [monthlyIncome, convert, currentCurrency]);
  const effectiveExpenses = useMemo(() => convert(monthlyExpenses, "ARS", currentCurrency), [monthlyExpenses, convert, currentCurrency]);
  const delta = effectiveIncome - effectiveExpenses;

  const fmt = useCallback(
    (n: number) => formatInCurrency(n, currentCurrency),
    [formatInCurrency, currentCurrency]
  );

  const handleCurrencyChange = (curr: Currency) => {
    updateSettings({ currency: curr });
  };

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground font-medium font-display">{t("balance.title")}</span>
          <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-lg">
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCurrencyChange(c.value)}
                className={`px-1.5 py-0.5 text-[10px] font-mono-data font-semibold rounded-md transition-colors ${
                  currentCurrency === c.value
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Consolidar balance en ${c.value}`}
              >
                {c.value}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={togglePrivacyMode}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isPrivacyMode ? t("balance.show") : t("balance.hide")}
          title={isPrivacyMode ? "Mostrar saldos (tecla H)" : "Ocultar saldos (Modo Privacidad - tecla H)"}
        >
          {isPrivacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="mt-1">
        {!isPrivacyMode ? (
          <AnimatedNumber
            value={effectiveTotal}
            formatter={fmt}
            className="font-mono-data text-[32px] text-foreground tracking-tight leading-none"
          />
        ) : (
          <span className="font-mono-data text-[32px] text-foreground tracking-tight leading-none select-none">{HIDDEN}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t("balance.income")}</span>
          <span className="font-mono-data text-[14px] text-primary">
            {!isPrivacyMode ? `+${formatInCurrency(effectiveIncome, currentCurrency)}` : HIDDEN}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t("balance.expenses")}</span>
          <span className="font-mono-data text-[14px] text-foreground">
            {!isPrivacyMode ? `-${formatInCurrency(effectiveExpenses, currentCurrency)}` : HIDDEN}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{t("balance.delta")}</span>
          <span className={`font-mono-data text-[14px] ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
            {!isPrivacyMode
              ? `${delta >= 0 ? "+" : "-"}${formatInCurrency(Math.abs(delta), currentCurrency)}`
              : HIDDEN}
          </span>
        </div>
      </div>
    </div>
  );
}
