import { useMemo, useCallback } from "react";
import { Eye, EyeOff, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
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
  const { calculateConsolidatedBalance, formatInCurrency, convert } = useCurrencyConversion();
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
    <div className="px-4 pt-3 pb-2">
      <div className="hero-balance-surface p-4 sm:p-5 relative overflow-hidden">
        {/* Glow de fondo temático en esquina superior derecha */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Fila superior: Título del balance + Selector de divisas + Botón Privacidad */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider font-display">
              {t("balance.title")}
            </span>
            <div className="flex items-center gap-0.5 bg-secondary/80 p-0.5 theme-pill-btn border border-border/40">
              {CURRENCIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleCurrencyChange(c.value)}
                  className={`min-w-[32px] h-6 px-1.5 flex items-center justify-center text-[10px] font-mono-data font-bold theme-pill-btn transition-all active:scale-95 ${
                    currentCurrency === c.value
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
            className="p-1.5 theme-pill-btn text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label={isPrivacyMode ? t("balance.show") : t("balance.hide")}
            title={isPrivacyMode ? "Mostrar saldos (tecla H)" : "Ocultar saldos (Modo Privacidad - tecla H)"}
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Monto Principal Consolidado */}
        <div className="mt-2.5 mb-4 relative z-10">
          {!isPrivacyMode ? (
            <AnimatedNumber
              key={currentCurrency}
              value={effectiveTotal}
              formatter={fmt}
              className="font-mono-data text-[34px] sm:text-[38px] font-bold text-foreground tracking-tight leading-none drop-shadow-xs"
            />
          ) : (
            <span className="font-mono-data text-[34px] sm:text-[38px] font-bold text-foreground tracking-tight leading-none select-none">
              {HIDDEN}
            </span>
          )}
        </div>

        {/* Cápsulas Sensoriales de Métricas (Ingresos / Gastos / Resultado) */}
        <div className="grid grid-cols-3 gap-2 relative z-10 pt-2 border-t border-border/40">
          {/* Ingresos */}
          <div className="flex flex-col p-2 theme-pill-btn bg-secondary/40 border border-border/30">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-0.5">
              <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-2.5 h-2.5 text-primary" />
              </div>
              <span className="truncate">{t("balance.income")}</span>
            </div>
            <span className="font-mono-data text-[12px] sm:text-[13px] font-semibold text-primary truncate">
              {!isPrivacyMode ? `+${formatInCurrency(effectiveIncome, currentCurrency)}` : HIDDEN}
            </span>
          </div>

          {/* Gastos */}
          <div className="flex flex-col p-2 theme-pill-btn bg-secondary/40 border border-border/30">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-0.5">
              <div className="w-3.5 h-3.5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                <TrendingDown className="w-2.5 h-2.5 text-destructive" />
              </div>
              <span className="truncate">{t("balance.expenses")}</span>
            </div>
            <span className="font-mono-data text-[12px] sm:text-[13px] font-semibold text-foreground truncate">
              {!isPrivacyMode ? `-${formatInCurrency(effectiveExpenses, currentCurrency)}` : HIDDEN}
            </span>
          </div>

          {/* Delta / Saldo del Mes */}
          <div className="flex flex-col p-2 theme-pill-btn bg-secondary/40 border border-border/30">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-0.5">
              <div className={`w-3.5 h-3.5 rounded-full ${delta >= 0 ? "bg-primary/20" : "bg-destructive/20"} flex items-center justify-center shrink-0`}>
                <span className={`text-[9px] font-bold ${delta >= 0 ? "text-primary" : "text-destructive"}`}>Δ</span>
              </div>
              <span className="truncate">{t("balance.delta")}</span>
            </div>
            <span className={`font-mono-data text-[12px] sm:text-[13px] font-semibold truncate ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
              {!isPrivacyMode
                ? `${delta >= 0 ? "+" : "-"}${formatInCurrency(Math.abs(delta), currentCurrency)}`
                : HIDDEN}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
