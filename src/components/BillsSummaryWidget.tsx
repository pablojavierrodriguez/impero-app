import { BillReminder } from "@/lib/types";
import { useSettings } from "@/lib/settings-store";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { Clock } from "lucide-react";

export function BillsSummaryWidget({ bills }: { bills: BillReminder[] }) {
  const { maskAmount } = usePrivacy();
  const { formatAmount: baseFormatAmount, t } = useSettings();
  const formatAmount = (n: number, opts?: any) => maskAmount(baseFormatAmount(n, opts));
  const now = new Date();
  const upcoming = bills
    .filter((b) => {
      const due = new Date(b.dueDate);
      return b.status !== "paid" && due >= now;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h2 className="text-[13px] text-muted-foreground font-medium mb-3 font-display">
        {t("dash.upcomingBills")}
      </h2>
      <div className="space-y-2">
        {upcoming.map((bill) => {
          const due = new Date(bill.dueDate);
          const daysUntil = Math.ceil(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div key={bill.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-[13px] text-foreground">{bill.name}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    {daysUntil <= 0 ? t("bill.dueToday") : `${daysUntil}d`}
                  </span>
                </div>
              </div>
              <span className="font-mono-data text-[13px] text-foreground">
                {formatAmount(bill.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
