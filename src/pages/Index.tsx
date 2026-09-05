import { useState, useEffect } from "react";
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
import { BudgetManager, BudgetSummaryWidget } from "@/components/BudgetManager";
import { GoalsManager, GoalsSummaryWidget } from "@/components/GoalsManager";
import { RecurringManager } from "@/components/RecurringManager";
import { BillReminders, BillsSummaryWidget } from "@/components/BillReminders";
import { ReportsPage } from "@/components/ReportsPage";
import { TagManager } from "@/components/TagManager";
import { RulesManager } from "@/components/RulesManager";
import { HealthScore } from "@/components/HealthScore";
import { UserProfilePage } from "@/components/UserProfile";
import { Transaction, Account } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { NetWorthChart } from "@/components/NetWorthChart";
import { PayStatementModal } from "@/components/PayStatementModal";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const Index = () => {
  const store = useFinanceStore();
  const { settings, isSectionEnabled, t, formatAmount } = useSettings();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [txFilters, setTxFilters] = useState<TransactionFilterValues>(EMPTY_FILTERS);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [payingCard, setPayingCard] = useState<Account | null>(null);
  const [payingAmount, setPayingAmount] = useState(0);

  const handleOpenPayStatement = (cardId: string, amount: number) => {
    const card = store.accounts.find((a) => a.id === cardId);
    if (card) {
      setPayingCard(card);
      setPayingAmount(amount);
    }
  };

  useEffect(() => { 
    store.processRecurring(); 
    // Detectar atajo PWA desde pantalla de inicio (?action=quick-add)
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "quick-add") {
      setQuickAddOpen(true);
      // Limpiar el parámetro de la URL limpiamente sin recargar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const pendingBillsCount = store.getPendingBills().filter(b => b.status !== "paid").length;

  // Health score computations
  const budgets = store.getCurrentMonthBudgets();
  const avgBudgetUsage = budgets.length > 0
    ? budgets.reduce((sum, b) => {
        const spent = store.getBudgetSpent(b.categoryId, b.month, b.year);
        return sum + (spent / b.amount) * 100;
      }, 0) / budgets.length
    : 50;
  const goalsProgress = store.goals.length > 0
    ? store.goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / store.goals.length
    : 0;

  // Week spending summary
  const weekLabel = `${t("dash.weekSpent")}: ${formatAmount(store.weekSpent)}`;

  return (
    <div className="min-h-screen bg-background flex" key="app-root">
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAdd={() => setQuickAddOpen(true)}
        onTransfer={() => setTransferOpen(true)}
        onImportCsv={() => setCsvImportOpen(true)}
        pendingBillsCount={pendingBillsCount}
      />
      <div className="flex-1 max-w-2xl mx-auto relative pb-20 md:pb-6 md:px-6 md:max-w-5xl lg:max-w-6xl">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit="exit"
          transition={{ duration: 0.2 }}>

          {activeTab === "dashboard" && (
            <div className="md:grid md:grid-cols-2 md:gap-6 md:pt-4">
              {/* Left column */}
              <div>
                {isSectionEnabled("velocity") && (
                  <VelocityBar spent={store.todaySpent} budget={settings.dailyBudget} />
                )}
                {isSectionEnabled("balance") && (
                  <BalanceHeader
                    totalBalance={store.totalBalance}
                    monthlyIncome={store.monthlyIncome}
                    monthlyExpenses={store.monthlyExpenses}
                    accounts={store.accounts}
                  />
                )}

                <div className="px-4 py-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {weekLabel}
                  </div>
                </div>

                {isSectionEnabled("accounts") && (
                  <div className="my-4">
                    <AccountCards accounts={store.getActiveAccounts()} />
                  </div>
                )}
                <NetWorthChart accounts={store.getActiveAccounts()} transactions={store.transactions} />
                {isSectionEnabled("breakdown") && (
                  <SpendingBreakdown transactions={store.transactions} />
                )}
              </div>

              {/* Right column */}
              <div>
                {isSectionEnabled("budgets") && (
                  <BudgetSummaryWidget budgets={store.budgets} categories={store.categories}
                    getBudgetSpent={store.getBudgetSpent} />
                )}
                {isSectionEnabled("goals") && (
                  <GoalsSummaryWidget goals={store.goals} />
                )}
                {isSectionEnabled("bills") && (
                  <BillsSummaryWidget bills={store.getPendingBills()} />
                )}

                <HealthScore
                  monthlyIncome={store.monthlyIncome}
                  monthlyExpenses={store.monthlyExpenses}
                  budgetsUsedPct={avgBudgetUsage}
                  goalsProgress={goalsProgress}
                  pendingBills={pendingBillsCount}
                />

                {isSectionEnabled("recent") && (
                  <div className="mt-2">
                    <TransactionList
                      transactions={store.transactions.slice(0, 5)}
                      accounts={store.accounts}
                      onSelect={setEditingTx}
                      onDelete={store.deleteTransaction}
                      onPayStatement={handleOpenPayStatement}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="pt-4">
              <div className="px-4 pb-3 flex items-center justify-between">
                <h1 className="text-[20px] font-display font-semibold text-foreground">{t("tx.history")}</h1>
                <button onClick={() => setCsvImportOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-secondary text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t("tx.importCsv")}
                </button>
              </div>
              <TransactionFilters filters={txFilters} onChange={setTxFilters}
                categories={store.getAllActiveCategories()} accounts={store.getActiveAccounts()} />
              <TransactionList
                transactions={applyFilters(store.transactions, txFilters)}
                accounts={store.accounts}
                onSelect={setEditingTx}
                onDelete={store.deleteTransaction}
                onPayStatement={handleOpenPayStatement}
              />
            </div>
          )}

          {activeTab === "cards" && (
            <CreditCardManager accounts={store.accounts} getCreditCards={store.getCreditCards}
              getArchivedAccounts={store.getArchivedAccounts} getTransactionsByAccount={store.getTransactionsByAccount}
              getStatementTransactions={store.getStatementTransactions} getNonCardAccounts={store.getNonCardAccounts}
              onAdd={store.addAccount} onUpdate={store.updateAccount} onArchive={store.archiveAccount}
              onUnarchive={store.unarchiveAccount} onPayCard={store.payCard} onSelectTransaction={setEditingTx} />
          )}

          {activeTab === "categories" && (
            <CategoryManager categories={store.categories} getRootCategories={store.getRootCategories}
              getSubcategories={store.getSubcategories} getArchivedCategories={store.getArchivedCategories}
              getTransactionCountByCategory={store.getTransactionCountByCategory} getAllActiveCategories={store.getAllActiveCategories}
              onAdd={store.addCategory} onUpdate={store.updateCategory} onArchive={store.archiveCategory}
              onUnarchive={store.unarchiveCategory} onDelete={store.deleteCategory} onReassign={store.reassignTransactions} />
          )}

          {activeTab === "accounts" && (
            <AccountManager accounts={store.accounts} getActiveAccounts={store.getActiveAccounts}
              getArchivedAccounts={store.getArchivedAccounts} getTransactionsByAccount={store.getTransactionsByAccount}
              onAdd={store.addAccount} onUpdate={store.updateAccount} onArchive={store.archiveAccount}
              onUnarchive={store.unarchiveAccount} onAdjustBalance={store.adjustAccountBalance}
              onSelectTransaction={setEditingTx} />
          )}

          {activeTab === "budgets" && (
            <BudgetManager budgets={store.budgets} categories={store.categories}
              transactions={store.transactions}
              getBudgetSpent={store.getBudgetSpent} getAllActiveCategories={store.getAllActiveCategories}
              onAdd={store.addBudget} onUpdate={store.updateBudget} onDelete={store.deleteBudget} />
          )}

          {activeTab === "goals" && (
            <GoalsManager goals={store.goals} accounts={store.getActiveAccounts()}
              onAdd={store.addGoal} onUpdate={store.updateGoal}
              onDelete={store.deleteGoal} onContribute={store.contributeToGoal} onWithdraw={store.withdrawFromGoal} />
          )}

          {activeTab === "recurring" && (
            <RecurringManager recurringTxs={store.recurringTxs} categories={store.getAllActiveCategories()}
              accounts={store.getActiveAccounts()} onAdd={store.addRecurringTx} onUpdate={store.updateRecurringTx}
              onDelete={store.deleteRecurringTx} onTogglePause={store.toggleRecurringPause} />
          )}

          {activeTab === "bills" && (
            <BillReminders bills={store.bills} accounts={store.getActiveAccounts()} categories={store.getAllActiveCategories()}
              onAdd={store.addBill} onUpdate={store.updateBill} onDelete={store.deleteBill}
              onMarkPaid={store.markBillPaid} getPendingBills={store.getPendingBills} />
          )}

          {activeTab === "reports" && (
            <ReportsPage
              transactions={store.transactions}
              accounts={store.accounts}
              monthlyExpenses={store.monthlyExpenses}
              monthlyIncome={store.monthlyIncome}
              recurringTxs={store.recurringTxs}
              bills={store.bills}
              getMonthlyTrend={store.getMonthlyTrend}
              getLastMonthExpenses={store.getLastMonthExpenses}
            />
          )}

          {activeTab === "tags" && (
            <TagManager tags={store.tags} onAdd={store.addTag} onUpdate={store.updateTag}
              onDelete={store.deleteTag} getTransactionCountByTag={store.getTransactionCountByTag} />
          )}

          {activeTab === "rules" && (
            <RulesManager
              rules={store.rules}
              categories={store.getAllActiveCategories()}
              onAddRule={store.addRule}
              onUpdateRule={store.updateRule}
              onDeleteRule={store.deleteRule}
              onToggleRule={store.toggleRule}
              onApplyRetroactively={store.applyRulesRetroactively}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage onImportCsv={() => setCsvImportOpen(true)} />
          )}

          {activeTab === "profile" && (
            <UserProfilePage />
          )}
        </motion.div>
      </AnimatePresence>

      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)}
        onSubmit={store.addTransaction} accounts={store.getActiveAccounts()}
        categories={store.getAllActiveCategories()} tags={store.tags} />

      <CsvImportSheet open={csvImportOpen} onClose={() => setCsvImportOpen(false)}
        onImport={store.importTransactions} accounts={store.getActiveAccounts()}
        categories={store.getAllActiveCategories()} existingTransactions={store.transactions} />

      <TransferSheet open={transferOpen} onClose={() => setTransferOpen(false)}
        accounts={store.accounts} onTransfer={store.transferBetweenAccounts} />

      <TransactionEditSheet transaction={editingTx} open={!!editingTx}
        onClose={() => setEditingTx(null)} onUpdate={store.updateTransaction}
        onDelete={store.deleteTransaction} onDeleteGroup={store.deleteInstallmentGroup}
        onDuplicate={store.duplicateTransaction}
        accounts={store.getActiveAccounts()} categories={store.getAllActiveCategories()} tags={store.tags} />

      <PayStatementModal
        open={!!payingCard}
        onClose={() => setPayingCard(null)}
        card={payingCard}
        suggestedAmount={payingAmount}
        sourceAccounts={store.getNonCardAccounts()}
        onConfirmPay={(cardId, fromAccountId, amount) => {
          store.payCard(cardId, fromAccountId, amount);
        }}
      />

      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab}
          onQuickAdd={() => setQuickAddOpen(true)} onTransfer={() => setTransferOpen(true)}
          pendingBillsCount={pendingBillsCount} />
      </div>
      </div>
    </div>
  );
};

export default Index;
