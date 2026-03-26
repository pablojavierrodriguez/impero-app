import { useState } from "react";
import { useFinanceStore } from "@/lib/finance-store";
import { useSettings } from "@/lib/settings-store";
import { VelocityBar } from "@/components/VelocityBar";
import { BalanceHeader } from "@/components/BalanceHeader";
import { AccountCards } from "@/components/AccountCards";
import { TransactionList } from "@/components/TransactionList";
import { SpendingBreakdown } from "@/components/SpendingBreakdown";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { CsvImportSheet } from "@/components/CsvImportSheet";
import { TransactionEditSheet } from "@/components/TransactionEditSheet";
import { TransferSheet } from "@/components/TransferSheet";
import { BottomNav } from "@/components/BottomNav";
import { CategoryManager } from "@/components/CategoryManager";
import { AccountManager } from "@/components/AccountManager";
import { CreditCardManager } from "@/components/CreditCardManager";
import { SettingsPage } from "@/components/SettingsPage";
import { TransactionFilters, applyFilters, EMPTY_FILTERS, TransactionFilterValues } from "@/components/TransactionFilters";
import { Transaction } from "@/lib/types";

const Index = () => {
  const store = useFinanceStore();
  const { settings, isSectionEnabled, t } = useSettings();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [txFilters, setTxFilters] = useState<TransactionFilterValues>(EMPTY_FILTERS);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-20" key="app-root">
      {activeTab === "dashboard" && (
        <>
          {isSectionEnabled("velocity") && (
            <VelocityBar spent={store.todaySpent} budget={settings.dailyBudget} />
          )}
          {isSectionEnabled("balance") && (
            <BalanceHeader
              totalBalance={store.totalBalance}
              monthlyIncome={store.monthlyIncome}
              monthlyExpenses={store.monthlyExpenses}
            />
          )}
          {isSectionEnabled("accounts") && (
            <div className="my-4">
              <AccountCards accounts={store.getActiveAccounts()} />
            </div>
          )}
          {isSectionEnabled("breakdown") && (
            <SpendingBreakdown transactions={store.transactions} />
          )}
          {isSectionEnabled("recent") && (
            <div className="mt-2">
              <TransactionList
                transactions={store.transactions.slice(0, 5)}
                onSelect={setEditingTx}
              />
            </div>
          )}
        </>
      )}

      {activeTab === "transactions" && (
        <div className="pt-4">
          <div className="px-4 pb-3 flex items-center justify-between">
            <h1 className="text-[20px] font-display font-semibold text-foreground">{t("tx.history")}</h1>
            <button
              onClick={() => setCsvImportOpen(true)}
              className="px-3 py-1.5 rounded-full bg-secondary text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("tx.importCsv")}
            </button>
          </div>
          <TransactionFilters
            filters={txFilters}
            onChange={setTxFilters}
            categories={store.getAllActiveCategories()}
            accounts={store.getActiveAccounts()}
          />
          <TransactionList
            transactions={applyFilters(store.transactions, txFilters)}
            onSelect={setEditingTx}
          />
        </div>
      )}

      {activeTab === "cards" && (
        <CreditCardManager
          accounts={store.accounts}
          getCreditCards={store.getCreditCards}
          getArchivedAccounts={store.getArchivedAccounts}
          getTransactionsByAccount={store.getTransactionsByAccount}
          getStatementTransactions={store.getStatementTransactions}
          getNonCardAccounts={store.getNonCardAccounts}
          onAdd={store.addAccount}
          onUpdate={store.updateAccount}
          onArchive={store.archiveAccount}
          onUnarchive={store.unarchiveAccount}
          onPayCard={store.payCard}
          onSelectTransaction={setEditingTx}
        />
      )}

      {activeTab === "categories" && (
        <CategoryManager
          categories={store.categories}
          getRootCategories={store.getRootCategories}
          getSubcategories={store.getSubcategories}
          getArchivedCategories={store.getArchivedCategories}
          getTransactionCountByCategory={store.getTransactionCountByCategory}
          getAllActiveCategories={store.getAllActiveCategories}
          onAdd={store.addCategory}
          onUpdate={store.updateCategory}
          onArchive={store.archiveCategory}
          onUnarchive={store.unarchiveCategory}
          onDelete={store.deleteCategory}
          onReassign={store.reassignTransactions}
        />
      )}

      {activeTab === "accounts" && (
        <AccountManager
          accounts={store.accounts}
          getActiveAccounts={store.getActiveAccounts}
          getArchivedAccounts={store.getArchivedAccounts}
          getTransactionsByAccount={store.getTransactionsByAccount}
          onAdd={store.addAccount}
          onUpdate={store.updateAccount}
          onArchive={store.archiveAccount}
          onUnarchive={store.unarchiveAccount}
          onAdjustBalance={store.adjustAccountBalance}
          onSelectTransaction={setEditingTx}
        />
      )}

      {activeTab === "settings" && (
        <SettingsPage
          onImportCsv={() => setCsvImportOpen(true)}
        />
      )}

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSubmit={store.addTransaction}
        accounts={store.getActiveAccounts()}
        categories={store.getAllActiveCategories()}
      />

      <CsvImportSheet
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        onImport={store.importTransactions}
        accounts={store.getActiveAccounts()}
      />

      <TransferSheet
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        accounts={store.accounts}
        onTransfer={store.transferBetweenAccounts}
      />

      <TransactionEditSheet
        transaction={editingTx}
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        onUpdate={store.updateTransaction}
        onDelete={store.deleteTransaction}
        accounts={store.getActiveAccounts()}
        categories={store.getAllActiveCategories()}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAdd={() => setQuickAddOpen(true)}
        onTransfer={() => setTransferOpen(true)}
      />
    </div>
  );
};

export default Index;
