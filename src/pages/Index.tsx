import { useState } from "react";
import { useFinanceStore } from "@/lib/finance-store";
import { VelocityBar } from "@/components/VelocityBar";
import { BalanceHeader } from "@/components/BalanceHeader";
import { AccountCards } from "@/components/AccountCards";
import { TransactionList } from "@/components/TransactionList";
import { SpendingBreakdown } from "@/components/SpendingBreakdown";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { BottomNav } from "@/components/BottomNav";

const Index = () => {
  const store = useFinanceStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      <VelocityBar spent={store.todaySpent} budget={store.dailyBudget} />

      {activeTab === "dashboard" && (
        <>
          <BalanceHeader
            totalBalance={store.totalBalance}
            monthlyIncome={store.monthlyIncome}
            monthlyExpenses={store.monthlyExpenses}
          />
          <div className="my-4">
            <AccountCards accounts={store.accounts} />
          </div>
          <SpendingBreakdown transactions={store.transactions} />
          <div className="mt-2">
            <TransactionList transactions={store.transactions.slice(0, 5)} />
          </div>
        </>
      )}

      {activeTab === "transactions" && (
        <div className="pt-4">
          <div className="px-4 pb-3">
            <h1 className="text-[20px] font-display font-semibold text-foreground">Transaction History</h1>
          </div>
          <TransactionList transactions={store.transactions} />
        </div>
      )}

      {activeTab === "accounts" && (
        <div className="pt-4">
          <div className="px-4 pb-3">
            <h1 className="text-[20px] font-display font-semibold text-foreground">Accounts</h1>
          </div>
          <AccountCards accounts={store.accounts} />
          <div className="mt-6">
            <SpendingBreakdown transactions={store.transactions} />
          </div>
        </div>
      )}

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSubmit={store.addTransaction}
        accounts={store.accounts}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAdd={() => setQuickAddOpen(true)}
      />
    </div>
  );
};

export default Index;
