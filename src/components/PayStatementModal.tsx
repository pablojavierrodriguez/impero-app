import { useState } from "react";
import { Account } from "@/lib/types";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { DollarSign, CreditCard } from "lucide-react";
import { useSettings } from "@/lib/settings-store";

interface PayStatementModalProps {
  open: boolean;
  onClose: () => void;
  card: Account | null;
  suggestedAmount: number;
  sourceAccounts: Account[];
  onConfirmPay: (cardId: string, fromAccountId: string, amount: number) => void;
}

export function PayStatementModal({
  open,
  onClose,
  card,
  suggestedAmount,
  sourceAccounts,
  onConfirmPay,
}: PayStatementModalProps) {
  const { formatAmount } = useSettings();
  const [amount, setAmount] = useState(suggestedAmount > 0 ? suggestedAmount.toString() : "");
  const [fromAccountId, setFromAccountId] = useState(sourceAccounts[0]?.id || "");

  if (!card) return null;

  const handlePay = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !fromAccountId) return;
    onConfirmPay(card.id, fromAccountId, parsed);
    onClose();
  };

  return (
    <ResponsiveSheet open={open} onClose={onClose} title={`Pagar Resumen: ${card.name}`}>
      <div className="p-4 space-y-4">
        <div className="card-surface">
          <div className="card-inner flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[12px] ${card.color} flex items-center justify-center text-white`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-medium text-foreground block">{card.name}</span>
                <span className="text-xs text-muted-foreground">Deuda del resumen</span>
              </div>
            </div>
            <span className="font-mono-data text-lg font-semibold text-destructive">
              {formatAmount(suggestedAmount)}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Monto a pagar
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-input border border-border text-foreground font-mono-data text-base focus:border-primary outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Debitar desde la cuenta
          </label>
          <div className="grid grid-cols-1 gap-2">
            {sourceAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => setFromAccountId(acc.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  fromAccountId === acc.id
                    ? "bg-secondary border-primary ring-1 ring-primary"
                    : "bg-secondary/40 border-border/60 hover:bg-secondary/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${acc.color}`} />
                  <span className="text-xs font-medium text-foreground">{acc.name}</span>
                </div>
                <span className="font-mono-data text-xs text-muted-foreground">
                  {formatAmount(acc.balance)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={!fromAccountId || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-[0.98] transition-all shadow-sm"
          >
            <DollarSign className="w-4 h-4" />
            Confirmar Pago
          </button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
