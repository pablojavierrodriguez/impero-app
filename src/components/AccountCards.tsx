import { Account } from "@/lib/types";
import { motion } from "framer-motion";
import { CategoryIcon } from "./CategoryIcon";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { Currency } from "@/lib/settings-types";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useSettings } from "@/lib/settings-store";
import { LayoutList, Columns } from "lucide-react";

interface AccountCardsProps {
  accounts: Account[];
  onSelectAccount?: (account: Account) => void;
}

export function AccountCards({ accounts, onSelectAccount }: AccountCardsProps) {
  const { formatInCurrency } = useCurrencyConversion();
  const { maskAmount } = usePrivacy();
  const { settings, updateSettings } = useSettings();

  const viewMode = settings.accountViewMode || "list";

  const toggleViewMode = () => {
    updateSettings({ accountViewMode: viewMode === "list" ? "carousel" : "list" });
  };

  return (
    <div className="px-4 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">
            Mis Cuentas & Tarjetas
          </span>
          <span className="text-[11px] text-muted-foreground">
            ({accounts.length})
          </span>
        </div>

        {/* View switcher toggle */}
        <button
          onClick={toggleViewMode}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
          title={viewMode === "list" ? "Ver en carrusel" : "Ver en lista ordenada"}
        >
          {viewMode === "list" ? (
            <>
              <Columns className="w-3.5 h-3.5" />
              <span>Carrusel</span>
            </>
          ) : (
            <>
              <LayoutList className="w-3.5 h-3.5" />
              <span>Lista</span>
            </>
          )}
        </button>
      </div>

      {viewMode === "list" ? (
        /* VISTA PRINCIPAL POR DEFECTO: Lista vertical ordenada, limpia, sin desbordes */
        <div className="flex flex-col gap-2">
          {accounts.map((account, i) => {
            const accCurrency = (account.currency as Currency) || "ARS";
            const isCredit = account.type === "credit";
            const limit = account.creditLimit || 0;
            const owed = Math.abs(Math.min(account.balance, 0));
            const available = Math.max(limit - owed, 0);
            const usedPct = limit > 0 ? Math.min((owed / limit) * 100, 100) : 0;

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectAccount?.(account)}
                className="card-surface cursor-pointer active:scale-[0.99] transition-transform w-full"
              >
                <div className="card-inner p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 theme-pill-btn ${account.color} flex items-center justify-center shrink-0 shadow-xs text-white`}>
                      <CategoryIcon name={account.icon || (isCredit ? "credit-card" : "wallet")} className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[14px] text-foreground font-semibold truncate block leading-snug">
                        {account.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground capitalize block leading-tight">
                        {isCredit ? (
                          limit > 0
                            ? `Límite disp: ${maskAmount(formatInCurrency(available, accCurrency))}`
                            : "Tarjeta de crédito"
                        ) : (
                          account.type || "Cuenta corriente"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-mono-data font-semibold px-1.5 py-0.5 theme-pill-btn bg-secondary text-muted-foreground">
                        {accCurrency}
                      </span>
                      <span className={`font-mono-data text-[16px] font-semibold tracking-tight ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                        {maskAmount(formatInCurrency(account.balance, accCurrency))}
                      </span>
                    </div>
                    {isCredit && limit > 0 && (
                      <div className="w-24 mt-1.5 ml-auto">
                        <div className="h-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            style={{ width: `${usedPct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              usedPct > 85 ? "bg-destructive" : usedPct > 65 ? "bg-amber-500" : "bg-primary"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* VISTA OPCIONAL: Carrusel contenido sin sangrado negativo fuera de pantalla */
        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-2.5 w-max">
            {accounts.map((account, i) => {
              const accCurrency = (account.currency as Currency) || "ARS";
              const isCredit = account.type === "credit";
              const limit = account.creditLimit || 0;
              const owed = Math.abs(Math.min(account.balance, 0));
              const available = Math.max(limit - owed, 0);
              const usedPct = limit > 0 ? Math.min((owed / limit) * 100, 100) : 0;

              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelectAccount?.(account)}
                  className="w-[180px] flex-shrink-0 card-surface cursor-pointer active:scale-98 transition-transform"
                >
                  <div className="card-inner p-3">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg ${account.color} flex items-center justify-center shrink-0 text-white shadow-xs`}>
                          <CategoryIcon name={account.icon || (isCredit ? "credit-card" : "wallet")} className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[13px] text-foreground font-semibold truncate block">{account.name}</span>
                      </div>
                      <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                        {accCurrency}
                      </span>
                    </div>

                    <div className="mt-1">
                      <span className="text-[10px] text-muted-foreground block leading-tight">
                        {isCredit ? "Saldo adeudado" : "Balance"}
                      </span>
                      <span className={`font-mono-data text-[16px] font-semibold tracking-tight ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                        {maskAmount(formatInCurrency(account.balance, accCurrency))}
                      </span>
                    </div>

                    {isCredit && limit > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Disp</span>
                          <span className="font-mono-data text-foreground">{maskAmount(formatInCurrency(available, accCurrency))}</span>
                        </div>
                        <div className="h-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            style={{ width: `${usedPct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              usedPct > 85 ? "bg-destructive" : usedPct > 65 ? "bg-amber-500" : "bg-primary"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
