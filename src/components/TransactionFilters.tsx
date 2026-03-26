import { useState } from "react";
import { Category, Account, Transaction } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/lib/settings-store";
import { useDebounce } from "@/hooks/useDebounce";

export interface TransactionFilterValues {
  search: string;
  type: "all" | "income" | "expense";
  categoryId: string | null;
  accountId: string | null;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const EMPTY_FILTERS: TransactionFilterValues = {
  search: "", type: "all", categoryId: null, accountId: null,
  dateFrom: "", dateTo: "", amountMin: "", amountMax: "",
};

interface TransactionFiltersProps {
  filters: TransactionFilterValues;
  onChange: (filters: TransactionFilterValues) => void;
  categories: Category[];
  accounts: Account[];
}

export function TransactionFilters({ filters, onChange, categories, accounts }: TransactionFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(localSearch, 300);
  const { t } = useSettings();

  // Update parent when debounced search changes
  if (debouncedSearch !== filters.search) {
    onChange({ ...filters, search: debouncedSearch });
  }

  const activeCount = [
    filters.search, filters.type !== "all" ? filters.type : "",
    filters.categoryId, filters.accountId,
    filters.dateFrom, filters.dateTo, filters.amountMin, filters.amountMax,
  ].filter(Boolean).length;

  const update = (partial: Partial<TransactionFilterValues>) => onChange({ ...filters, ...partial });
  const clearAll = () => onChange(EMPTY_FILTERS);

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("filters.search")} value={localSearch} onChange={e => setLocalSearch(e.target.value)}
            className="pl-9 h-9 bg-secondary border-0 text-[13px] rounded-xl" />
          {localSearch && (
            <button onClick={() => setLocalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-[12px] font-medium transition-colors ${
            expanded || activeCount > 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}>
          <Filter className="w-3.5 h-3.5" />
          {activeCount > 0 && <span>{activeCount}</span>}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="overflow-hidden">
            <div className="pt-3 space-y-3">
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.type")}</label>
                <div className="flex gap-1.5">
                  {(["all", "expense", "income"] as const).map(tp => (
                    <button key={tp} onClick={() => update({ type: tp })}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                        filters.type === tp ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}>
                      {tp === "all" ? t("filters.all") : tp === "expense" ? t("filters.expensesOnly") : t("filters.incomeOnly")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.category")}</label>
                <select value={filters.categoryId || ""} onChange={e => update({ categoryId: e.target.value || null })}
                  className="w-full h-9 rounded-xl bg-secondary border-0 text-[13px] text-foreground px-3 appearance-none">
                  <option value="">{t("filters.allCategories")}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.accountFilter")}</label>
                <select value={filters.accountId || ""} onChange={e => update({ accountId: e.target.value || null })}
                  className="w-full h-9 rounded-xl bg-secondary border-0 text-[13px] text-foreground px-3 appearance-none">
                  <option value="">{t("filters.allAccounts")}</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.date")}</label>
                <div className="flex gap-2">
                  <input type="date" value={filters.dateFrom} onChange={e => update({ dateFrom: e.target.value })}
                    className="flex-1 h-9 rounded-xl bg-secondary border-0 text-[13px] text-foreground px-3" />
                  <input type="date" value={filters.dateTo} onChange={e => update({ dateTo: e.target.value })}
                    className="flex-1 h-9 rounded-xl bg-secondary border-0 text-[13px] text-foreground px-3" />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.amountRange")}</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder={t("filters.min")} value={filters.amountMin}
                    onChange={e => update({ amountMin: e.target.value })} className="flex-1 h-9 bg-secondary border-0 text-[13px] rounded-xl" />
                  <Input type="number" placeholder={t("filters.max")} value={filters.amountMax}
                    onChange={e => update({ amountMax: e.target.value })} className="flex-1 h-9 bg-secondary border-0 text-[13px] rounded-xl" />
                </div>
              </div>

              {activeCount > 0 && (
                <button onClick={clearAll}
                  className="w-full py-2 rounded-xl text-[12px] font-medium text-destructive hover:bg-destructive/10 transition-colors">
                  {t("filters.clear")} ({activeCount})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function applyFilters(transactions: Transaction[], filters: TransactionFilterValues): Transaction[] {
  return transactions.filter(tx => {
    if (filters.search && !tx.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.type !== "all" && tx.type !== filters.type) return false;
    if (filters.categoryId && tx.category.id !== filters.categoryId) return false;
    if (filters.accountId && tx.accountId !== filters.accountId) return false;
    if (filters.dateFrom && tx.date < new Date(filters.dateFrom + "T00:00:00")) return false;
    if (filters.dateTo && tx.date > new Date(filters.dateTo + "T23:59:59")) return false;
    if (filters.amountMin && tx.amount < parseFloat(filters.amountMin)) return false;
    if (filters.amountMax && tx.amount > parseFloat(filters.amountMax)) return false;
    return true;
  });
}
