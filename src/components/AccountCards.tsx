import { Account } from "@/lib/types";
import { motion } from "framer-motion";

interface AccountCardsProps {
  accounts: Account[];
}

export function AccountCards({ accounts }: AccountCardsProps) {
  return (
    <div className="px-4">
      <div className="grid grid-cols-2 gap-3">
        {accounts.map((account, i) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 40 }}
            className="card-surface"
          >
            <div className="card-inner">
              <div className="flex items-center gap-2 mb-3">
                <div className={`category-dot ${account.color}`} />
                <span className="text-[12px] text-muted-foreground font-medium">{account.name}</span>
              </div>
              <span className={`font-mono-data text-[18px] ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                {account.balance < 0 ? "-" : ""}${Math.abs(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
