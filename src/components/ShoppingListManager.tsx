import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, ShoppingCart, Trash2, Check, Archive, CheckCircle2,
  Package, ChevronRight, DollarSign, ArrowLeft,
} from "lucide-react";
import { ShoppingList, ShoppingListItem, Account, Category } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { useSettings } from "@/lib/settings-store";
import { parseThousandsInput } from "@/lib/utils";
import { MoneyInput } from "@/components/ui/MoneyInput";

interface ShoppingListManagerProps {
  accounts: Account[];
  categories: Category[];
  onCheckout: (listName: string, totalAmount: number, accountId: string, categoryId: string) => void;
}

type ViewMode = "lists" | "create" | "detail" | "checkout";

export function ShoppingListManager({ accounts, categories, onCheckout }: ShoppingListManagerProps) {
  const { formatAmount, t } = useSettings();
  const [view, setView] = useState<ViewMode>("lists");
  const [lists, setLists] = useState<ShoppingList[]>([]);

  // Form state
  const [formName, setFormName] = useState("");

  // Detail state
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");

  // Checkout state
  const [checkoutAccountId, setCheckoutAccountId] = useState("");
  const [checkoutCategoryId, setCheckoutCategoryId] = useState("");

  const sourceAccounts = useMemo(
    () => accounts.filter(a => a.type !== "credit" && !a.archived),
    [accounts]
  );
  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === "expense" && !c.archived),
    [categories]
  );

  const activeLists = lists.filter(l => l.status === "active");
  const completedLists = lists.filter(l => l.status === "completed");

  // — Handlers —
  const handleCreateList = () => {
    if (!formName.trim()) return;
    const newList: ShoppingList = {
      id: `sl-${Date.now()}`,
      name: formName.trim(),
      status: "active",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLists(prev => [newList, ...prev]);
    setActiveList(newList);
    setFormName("");
    setView("detail");
  };

  const handleAddItem = () => {
    if (!activeList || !newItemName.trim()) return;
    const item: ShoppingListItem = {
      id: `sli-${Date.now()}`,
      listId: activeList.id,
      name: newItemName.trim(),
      quantity: parseFloat(newItemQty) || 1,
      unitPrice: parseThousandsInput(newItemPrice) || 0,
      isChecked: false,
      sortOrder: activeList.items.length,
    };
    const updated = { ...activeList, items: [...activeList.items, item], updatedAt: new Date() };
    setActiveList(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    setNewItemName("");
    setNewItemQty("1");
    setNewItemPrice("");
  };

  const toggleItem = useCallback((itemId: string) => {
    if (!activeList) return;
    const updatedItems = activeList.items.map(i =>
      i.id === itemId ? { ...i, isChecked: !i.isChecked } : i
    );
    const updated = { ...activeList, items: updatedItems, updatedAt: new Date() };
    setActiveList(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
  }, [activeList]);

  const removeItem = useCallback((itemId: string) => {
    if (!activeList) return;
    const updatedItems = activeList.items.filter(i => i.id !== itemId);
    const updated = { ...activeList, items: updatedItems, updatedAt: new Date() };
    setActiveList(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
  }, [activeList]);

  const deleteList = useCallback((listId: string) => {
    setLists(prev => prev.filter(l => l.id !== listId));
    if (activeList?.id === listId) {
      setActiveList(null);
      setView("lists");
    }
  }, [activeList]);

  const openCheckout = () => {
    if (!activeList || activeList.items.length === 0) return;
    setCheckoutAccountId(sourceAccounts[0]?.id || "");
    // Try to find a "groceries" or "supermercado" category
    const groceryCat = expenseCategories.find(c => c.name.toLowerCase().includes("super") || c.id === "groceries");
    setCheckoutCategoryId(groceryCat?.id || expenseCategories[0]?.id || "");
    setView("checkout");
  };

  const handleConfirmCheckout = () => {
    if (!activeList || !checkoutAccountId || !checkoutCategoryId) return;
    const checkedItems = activeList.items.filter(i => i.isChecked);
    const total = checkedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    if (total <= 0) return;

    onCheckout(activeList.name, total, checkoutAccountId, checkoutCategoryId);

    // Mark list as completed
    const updated = { ...activeList, status: "completed" as const, updatedAt: new Date() };
    setActiveList(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    setView("lists");
  };

  const getListTotal = (list: ShoppingList) =>
    list.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const getCheckedTotal = (list: ShoppingList) =>
    list.items.filter(i => i.isChecked).reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <div className="pt-4 pb-28">
      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between">
        {view === "lists" ? (
          <>
            <h1 className="text-[20px] font-display font-semibold text-foreground">Listas de Compras</h1>
            <button onClick={() => { setFormName(""); setView("create"); }} className="p-2 text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => view === "checkout" ? setView("detail") : setView("lists")} className="p-1 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-[16px] font-display font-semibold text-foreground">
              {view === "create" && "Nueva Lista"}
              {view === "detail" && activeList?.name}
              {view === "checkout" && "Completar Compra"}
            </h2>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* LISTS VIEW */}
        {view === "lists" && (
          <motion.div key="lists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
            {activeLists.length === 0 && completedLists.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-[13px]">Aún no tenés listas de compras.</p>
                <p className="text-muted-foreground text-[12px] mt-1">Creá una para organizar tus compras y registrar el gasto al terminar.</p>
              </div>
            )}

            {activeLists.length > 0 && (
              <div className="mb-4">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">Activas</label>
                {activeLists.map((list, i) => {
                  const total = getListTotal(list);
                  const checkedCount = list.items.filter(i => i.isChecked).length;
                  return (
                    <motion.div
                      key={list.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="mb-2"
                    >
                      <button
                        onClick={() => { setActiveList(list); setView("detail"); }}
                        className="w-full card-surface text-left"
                      >
                        <div className="card-inner flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[12px] bg-primary/15 flex items-center justify-center">
                              <ShoppingCart className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="text-[14px] text-foreground font-medium block">{list.name}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {list.items.length} ítems · {checkedCount} tildados
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-data text-[14px] text-foreground">{formatAmount(total)}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {completedLists.length > 0 && (
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">Completadas</label>
                {completedLists.map(list => (
                  <div key={list.id} className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-[13px] text-muted-foreground">{list.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2">
                          {formatAmount(getListTotal(list))}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteList(list.id)} className="p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* CREATE VIEW */}
        {view === "create" && (
          <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Nombre de la lista</label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Ej: Súper del mes, Farmacia"
              autoFocus
              className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-primary outline-none transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setView("lists")} className="flex-1 h-11 rounded-[12px] bg-secondary text-foreground font-medium text-[14px]">
                Cancelar
              </button>
              <button
                onClick={handleCreateList}
                disabled={!formName.trim()}
                className="flex-[2] h-11 rounded-[12px] bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                Crear Lista
              </button>
            </div>
          </motion.div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && activeList && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Summary card */}
            <div className="px-4 mb-4">
              <div className="card-surface">
                <div className="card-inner">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Ítems</span>
                      <span className="font-mono-data text-[16px] text-foreground font-semibold">{activeList.items.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Tildados</span>
                      <span className="font-mono-data text-[16px] text-emerald-500 font-semibold">
                        {activeList.items.filter(i => i.isChecked).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total est.</span>
                      <span className="font-mono-data text-[16px] text-foreground font-semibold">{formatAmount(getListTotal(activeList))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add item form */}
            <div className="px-4 mb-4">
              <div className="flex gap-2">
                <input
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Nombre del ítem"
                  className="flex-1 h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[13px] placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
                  onKeyDown={e => e.key === "Enter" && handleAddItem()}
                />
                <input
                  value={newItemQty}
                  onChange={e => setNewItemQty(e.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Qty"
                  className="w-14 h-10 px-2 rounded-[10px] bg-input border border-border text-foreground text-[13px] font-mono-data text-center focus:border-primary outline-none transition-colors"
                />
                <div className="w-24">
                  <MoneyInput
                    value={newItemPrice}
                    onChange={(val) => setNewItemPrice(val)}
                    placeholder="Precio"
                    className="h-10 text-[13px] text-center"
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!newItemName.trim()}
                  className="h-10 w-10 rounded-[10px] bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-[0.95] transition-all flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="px-4">
              {activeList.items.length === 0 && (
                <p className="text-muted-foreground text-[13px] text-center py-8">
                  Agregá ítems a la lista con el formulario de arriba.
                </p>
              )}
              <div className="space-y-1">
                {activeList.items.map(item => {
                  const itemTotal = item.quantity * item.unitPrice;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-[12px] transition-colors ${
                        item.isChecked ? "bg-emerald-500/5" : "bg-secondary/40"
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          item.isChecked
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {item.isChecked && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className={`flex-1 min-w-0 ${item.isChecked ? "opacity-50" : ""}`}>
                        <span className={`text-[13px] text-foreground block ${item.isChecked ? "line-through" : ""}`}>
                          {item.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {item.quantity} × {formatAmount(item.unitPrice)}
                        </span>
                      </div>
                      <span className={`font-mono-data text-[13px] ${item.isChecked ? "text-emerald-500" : "text-foreground"}`}>
                        {formatAmount(itemTotal)}
                      </span>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Checkout + delete buttons */}
            {activeList.items.length > 0 && activeList.status === "active" && (
              <div className="px-4 mt-4 flex gap-3">
                <button
                  onClick={() => deleteList(activeList.id)}
                  className="h-11 w-11 rounded-[12px] bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={openCheckout}
                  disabled={activeList.items.filter(i => i.isChecked).length === 0}
                  className="flex-1 h-11 rounded-[12px] bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-40 inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completar Compra ({formatAmount(getCheckedTotal(activeList))})
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* CHECKOUT VIEW */}
        {view === "checkout" && activeList && (
          <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            {/* Summary */}
            <div className="card-surface mb-4">
              <div className="card-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-emerald-500/15 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[14px] text-foreground font-medium">{activeList.name}</span>
                    <div className="text-[12px] text-muted-foreground">
                      {activeList.items.filter(i => i.isChecked).length} ítems tildados
                    </div>
                  </div>
                  <span className="font-mono-data text-[20px] text-foreground font-semibold">
                    {formatAmount(getCheckedTotal(activeList))}
                  </span>
                </div>
              </div>
            </div>

            {/* Account selector */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Debitar desde</label>
            <div className="space-y-1.5 mb-4">
              {sourceAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setCheckoutAccountId(acc.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-[12px] transition-all text-left ${
                    checkoutAccountId === acc.id
                      ? "bg-secondary border border-primary/40 ring-1 ring-primary/20"
                      : "bg-secondary/40 border border-border/50 hover:bg-secondary/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${acc.color}`} />
                    <span className="text-[13px] font-medium text-foreground">{acc.name}</span>
                  </div>
                  <span className="font-mono-data text-[12px] text-muted-foreground">{formatAmount(acc.balance)}</span>
                </button>
              ))}
            </div>

            {/* Category selector */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Categoría</label>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {expenseCategories.slice(0, 12).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCheckoutCategoryId(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium transition-all ${
                    checkoutCategoryId === cat.id
                      ? "bg-secondary text-foreground ring-1 ring-primary/30"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <CategoryIcon name={cat.icon || "circle-dot"} className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Confirm */}
            <div className="flex gap-3">
              <button onClick={() => setView("detail")} className="flex-1 h-11 rounded-[12px] bg-secondary text-foreground font-medium text-[14px]">
                Volver
              </button>
              <button
                onClick={handleConfirmCheckout}
                disabled={!checkoutAccountId || !checkoutCategoryId}
                className="flex-[2] h-11 rounded-[12px] bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-40 inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <DollarSign className="w-4 h-4" />
                Registrar Gasto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
