import { Account } from "@/lib/types";
import { motion } from "framer-motion";
import { CategoryIcon } from "./CategoryIcon";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { Currency } from "@/lib/settings-types";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface AccountCardsProps {
  accounts: Account[];
}

export function AccountCards({ accounts }: AccountCardsProps) {
  const { formatInCurrency } = useCurrencyConversion();
  const { maskAmount } = usePrivacy();

  return (
    <div className="px-4">
      <div className="grid grid-cols-2 gap-3">
        {accounts.map((account, i) => {
          const accCurrency = (account.currency as Currency) || "ARS";
          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 40 }}
              className="card-surface"
            >
              <div className="card-inner">
                <div className="flex items-center justify-between gap-1 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-[8px] ${account.color} flex items-center justify-center shrink-0`}>
                      <CategoryIcon name={account.icon || "wallet"} className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[12px] text-muted-foreground font-medium truncate">{account.name}</span>
                  </div>
                  <span className="text-[10px] font-mono-data font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                    {accCurrency}
                  </span>
                </div>
                <span className={`font-mono-data text-[18px] ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                  {maskAmount(formatInCurrency(account.balance, accCurrency))}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
