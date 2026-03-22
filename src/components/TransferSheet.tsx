import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Account } from "@/lib/types";
import { ArrowDown, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface TransferSheetProps {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  onTransfer: (fromId: string, toId: string, amount: number) => void;
}

export function TransferSheet({ open, onClose, accounts, onTransfer }: TransferSheetProps) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");

  const nonCardAccounts = accounts.filter(a => a.type !== "credit" && !a.archived);
  const fromAccount = nonCardAccounts.find(a => a.id === fromId);
  const toAccount = nonCardAccounts.find(a => a.id === toId);
  const parsedAmount = parseFloat(amount);
  const valid = fromId && toId && fromId !== toId && parsedAmount > 0;

  const handleSubmit = () => {
    if (!valid) return;
    onTransfer(fromId, toId, parsedAmount);
    toast.success(`Transferred $${parsedAmount.toFixed(2)}`);
    setFromId("");
    setToId("");
    setAmount("");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl bg-card border-border/50 max-w-md mx-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-foreground flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Transfer Between Accounts
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* From account */}
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">From</label>
            <select
              value={fromId}
              onChange={e => setFromId(e.target.value)}
              className="w-full mt-1 bg-secondary rounded-xl px-3 py-2.5 text-[14px] text-foreground border-none outline-none"
            >
              <option value="">Select account</option>
              {nonCardAccounts.filter(a => a.id !== toId).map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — ${a.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* To account */}
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">To</label>
            <select
              value={toId}
              onChange={e => setToId(e.target.value)}
              className="w-full mt-1 bg-secondary rounded-xl px-3 py-2.5 text-[14px] text-foreground border-none outline-none"
            >
              <option value="">Select account</option>
              {nonCardAccounts.filter(a => a.id !== fromId).map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — ${a.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full mt-1 bg-secondary rounded-xl px-3 py-2.5 text-[14px] text-foreground font-mono-data border-none outline-none"
            />
          </div>

          {/* Preview */}
          {valid && fromAccount && toAccount && (
            <div className="bg-secondary/50 rounded-xl p-3 text-[12px] text-muted-foreground space-y-1">
              <div>{fromAccount.name}: ${fromAccount.balance.toFixed(2)} → ${(fromAccount.balance - parsedAmount).toFixed(2)}</div>
              <div>{toAccount.name}: ${toAccount.balance.toFixed(2)} → ${(toAccount.balance + parsedAmount).toFixed(2)}</div>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!valid}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-40 transition-opacity"
          >
            Confirm Transfer
          </motion.button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
