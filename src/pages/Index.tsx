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
import { ShoppingListManager } from "@/components/ShoppingListManager";
import { HealthScore } from "@/components/HealthScore";
import { UserProfilePage } from "@/components/UserProfile";
import { Transaction, Account } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { NetWorthChart } from "@/components/NetWorthChart";
import { PayStatementModal } from "@/components/PayStatementModal";
import { MonthSelector } from "@/components/MonthSelector";
import { TrendingDown, TrendingUp, Calendar, Sparkles } from "lucide-react";

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
  const [quickAddType, setQuickAddType] = useState<"expense" | "income">("expense");
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [txFilters, setTxFilters] = useState<TransactionFilterValues>(EMPTY_FILTERS);
  const [selectedDetailAccountId, setSelectedDetailAccountId] = useState<string | null>(null);

  const handleOpenQuickAdd = (type: "expense" | "income" = "expense") => {
    setQuickAddType(type);
    setQuickAddOpen(true);
  };
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

  const handleSelectAccountFromHome = (account: Account) => {
    setSelectedDetailAccountId(account.id);
    if (account.type === "credit") {
      setActiveTab("cards");
    } else {
      setActiveTab("accounts");
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

  // Métricas reactivas al mes seleccionado
  const selMonth = selectedDate.getMonth();
  const selYear = selectedDate.getFullYear();

  const selectedMonthExpenses = store.transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === selMonth && t.date.getFullYear() === selYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const selectedMonthIncome = store.transactions
    .filter(t => t.type === "income" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === selMonth && t.date.getFullYear() === selYear)
    .reduce((sum, t) => sum + t.amount, 0);

  // Comparativa contra mes anterior
  const prevDate = new Date(selYear, selMonth - 1, 1);
  const prevMonthExpenses = store.transactions
    .filter(t => t.type === "expense" && !t.isCardPayment && !t.isTransfer && t.date.getMonth() === prevDate.getMonth() && t.date.getFullYear() === prevDate.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseDiffPct = prevMonthExpenses > 0
    ? Math.round(((selectedMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100)
    : 0;

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
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-background flex w-full overflow-x-hidden" key="app-root">
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAdd={() => setQuickAddOpen(true)}
        onTransfer={() => setTransferOpen(true)}
        onImportCsv={() => setCsvImportOpen(true)}
        pendingBillsCount={pendingBillsCount}
      />
      <div className="flex-1 w-full min-w-0 max-w-2xl mx-auto relative pb-20 md:pb-6 md:px-6 md:max-w-5xl lg:max-w-6xl md:h-screen md:overflow-y-auto overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit="exit"
          transition={{ duration: 0.2 }} className="w-full min-w-0">

          {activeTab === "dashboard" && (
            <div className="md:grid md:grid-cols-2 md:gap-6 md:pt-4">
              {/* Left column */}
              <div>
                {/* Selector de Mes Global (< Mes Año >) */}
                <div className="px-4 pt-2 pb-2">
                  <MonthSelector
                    currentDate={selectedDate}
                    onChangeDate={setSelectedDate}
                  />
                </div>

                {isSectionEnabled("velocity") && (
                  <VelocityBar spent={store.todaySpent} budget={settings.dailyBudget} />
                )}
                {isSectionEnabled("balance") && (
                  <BalanceHeader
                    totalBalance={store.totalBalance}
                    monthlyIncome={selectedMonthIncome}
                    monthlyExpenses={selectedMonthExpenses}
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
                    <AccountCards
                      accounts={store.getActiveAccounts()}
                      onSelectAccount={handleSelectAccountFromHome}
                    />
                  </div>
                )}
                <NetWorthChart accounts={store.getActiveAccounts()} transactions={store.transactions} />
                {isSectionEnabled("breakdown") && (
                  <SpendingBreakdown
                    transactions={store.transactions}
                    referenceDate={selectedDate}
                  />
                )}
              </div>

              {/* Right column: Panel Lateral de Contexto & Histórico */}
              <div className="space-y-4 pt-2 md:pt-0">
                {/* Tarjeta Comparativa contra Mes Anterior (Monthly Insights) */}
                <div className="px-4">
                  <div className="card-surface p-3.5 rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/40 via-card to-secondary/20 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-foreground font-display">
                          Comparativa Mensual
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono-data">
                        vs. mes anterior
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30">
                        <span className="text-[11px] text-muted-foreground block mb-0.5">Gasto del período</span>
                        <span className="font-mono-data text-sm font-semibold text-foreground">
                          {formatAmount(selectedMonthExpenses)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/30">
                        <span className="text-[11px] text-muted-foreground block mb-0.5">Variación</span>
                        <div className="flex items-center gap-1">
                          {expenseDiffPct <= 0 ? (
                            <>
                              <TrendingDown className="w-3.5 h-3.5 text-primary" />
                              <span className="font-mono-data text-sm font-semibold text-primary">
                                {expenseDiffPct}%
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                              <span className="font-mono-data text-sm font-semibold text-destructive">
                                +{expenseDiffPct}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

              {/* Selector de Mes Global en Historial */}
              <div className="px-4 mb-3">
                <MonthSelector
                  currentDate={selectedDate}
                  onChangeDate={setSelectedDate}
                />
              </div>

              <TransactionFilters filters={txFilters} onChange={setTxFilters}
                categories={store.getAllActiveCategories()} accounts={store.getActiveAccounts()} />

              {/* Transacciones del mes seleccionado, combinadas con los filtros activos */}
              <TransactionList
                transactions={applyFilters(
                  store.transactions.filter(t => {
                    // Si el usuario fijó fechas manuales en los filtros avanzados, respetarlas
                    if (txFilters.dateFrom || txFilters.dateTo) return true;
                    return t.date.getMonth() === selectedDate.getMonth() &&
                           t.date.getFullYear() === selectedDate.getFullYear();
                  }),
                  txFilters
                )}
                accounts={store.accounts}
                onSelect={setEditingTx}
                onDelete={store.deleteTransaction}
                onPayStatement={handleOpenPayStatement}
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
              initialSelectedCardId={selectedDetailAccountId}
              onClearInitialCard={() => setSelectedDetailAccountId(null)}
            />
          )}

          {activeTab === "categories" && (
            <CategoryManager categories={store.categories} getRootCategories={store.getRootCategories}
              getSubcategories={store.getSubcategories} getArchivedCategories={store.getArchivedCategories}
              getTransactionCountByCategory={store.getTransactionCountByCategory} getAllActiveCategories={store.getAllActiveCategories}
              onAdd={store.addCategory} onUpdate={store.updateCategory} onArchive={store.archiveCategory}
              onUnarchive={store.unarchiveCategory} onDelete={store.deleteCategory} onReassign={store.reassignTransactions} />
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
              initialSelectedAccountId={selectedDetailAccountId}
              onClearInitialAccount={() => setSelectedDetailAccountId(null)}
            />
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

          {activeTab === "shopping" && (
            <ShoppingListManager
              accounts={store.accounts}
              categories={store.getAllActiveCategories()}
              onCheckout={(listName, totalAmount, accountId, categoryId) => {
                const cat = store.getAllActiveCategories().find(c => c.id === categoryId);
                if (!cat) return;
                store.addTransaction(
                  totalAmount,
                  `Compra: ${listName}`,
                  cat,
                  "expense",
                  accountId
                );
              }}
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
        categories={store.getAllActiveCategories()} tags={store.tags}
        initialType={quickAddType} />

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
          onQuickAdd={(type) => handleOpenQuickAdd(type)} onTransfer={() => setTransferOpen(true)}
          onImportCsv={() => setCsvImportOpen(true)}
          pendingBillsCount={pendingBillsCount} />
      </div>
      </div>
    </div>
  );
};

export default Index;
