import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Archive, ChevronRight, Pencil, Trash2, ArchiveRestore, X, ChevronDown, FolderInput } from "lucide-react";
import { Category, CATEGORY_COLORS, CATEGORY_ICONS, TransactionType } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryManagerProps {
  categories: Category[];
  getRootCategories: (type?: TransactionType) => Category[];
  getSubcategories: (parentId: string) => Category[];
  getArchivedCategories: () => Category[];
  getTransactionCountByCategory: (id: string) => number;
  getAllActiveCategories: (type?: TransactionType) => Category[];
  onAdd: (cat: Category) => void;
  onUpdate: (id: string, updates: Partial<Category>) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReassign: (fromId: string, toId: string) => void;
}

type ViewMode = "list" | "edit" | "create" | "archived" | "reassign";

export function CategoryManager({
  categories, getRootCategories, getSubcategories, getArchivedCategories,
  getTransactionCountByCategory, getAllActiveCategories,
  onAdd, onUpdate, onArchive, onUnarchive, onDelete, onReassign,
}: CategoryManagerProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionType>("expense");
  const [view, setView] = useState<ViewMode>("list");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Create/edit form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(CATEGORY_COLORS[0]);
  const [formIcon, setFormIcon] = useState(CATEGORY_ICONS[0]);
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [formType, setFormType] = useState<TransactionType>("expense");

  // Reassign state
  const [reassignAction, setReassignAction] = useState<"delete" | "archive">("delete");
  const [reassignTargetId, setReassignTargetId] = useState<string>("");
  const [reassignCat, setReassignCat] = useState<Category | null>(null);
  const [skipReassign, setSkipReassign] = useState(false);

  const rootCats = getRootCategories(typeFilter);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreate = (parentId?: string) => {
    setFormName("");
    setFormColor(CATEGORY_COLORS[0]);
    setFormIcon(CATEGORY_ICONS[0]);
    setFormParentId(parentId ?? null);
    setFormType(typeFilter);
    setEditingCat(null);
    setView("create");
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormIcon(cat.icon || CATEGORY_ICONS[0]);
    setFormParentId(cat.parentId ?? null);
    setFormType(cat.type);
    setEditingCat(cat);
    setView("edit");
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editingCat) {
      onUpdate(editingCat.id, {
        name: formName.trim(),
        color: formColor,
        icon: formIcon,
        parentId: formParentId,
        type: formType,
      });
    } else {
      onAdd({
        id: `cat-${Date.now()}`,
        name: formName.trim(),
        color: formColor,
        type: formType,
        icon: formIcon,
        parentId: formParentId,
        archived: false,
      });
    }
    setView("list");
  };

  const handleDeleteOrArchive = (cat: Category, action: "delete" | "archive") => {
    const count = getTransactionCountByCategory(cat.id);
    if (count > 0) {
      setReassignCat(cat);
      setReassignAction(action);
      setReassignTargetId("");
      setSkipReassign(false);
      setView("reassign");
    } else {
      action === "delete" ? onDelete(cat.id) : onArchive(cat.id);
    }
  };

  const handleReassignConfirm = () => {
    if (!reassignCat) return;
    if (!skipReassign && reassignTargetId) {
      onReassign(reassignCat.id, reassignTargetId);
    }
    reassignAction === "delete" ? onDelete(reassignCat.id) : onArchive(reassignCat.id);
    setView("list");
    setReassignCat(null);
  };

  const archivedCats = getArchivedCategories();
  const availableParents = getRootCategories(formType).filter(c => c.id !== editingCat?.id);
  const reassignOptions = getAllActiveCategories(reassignCat?.type).filter(c => c.id !== reassignCat?.id);

  return (
    <div className="pt-4 pb-28">
      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <h1 className="text-[20px] font-display font-semibold text-foreground">Categories</h1>
        <div className="flex gap-2">
          <button onClick={() => setView("archived")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Archive className="w-4 h-4" />
          </button>
          <button onClick={() => openCreate()} className="p-2 text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Type toggle */}
      <div className="px-4 mb-4">
        <div className="flex bg-secondary rounded-full p-0.5 w-fit">
          {(["expense", "income"] as TransactionType[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                typeFilter === t ? "bg-card text-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "expense" ? "Expenses" : "Income"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* LIST VIEW */}
        {view === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
            {rootCats.length === 0 && (
              <p className="text-muted-foreground text-[13px] text-center py-8">No categories yet. Tap + to create one.</p>
            )}
            {rootCats.map(cat => {
              const subs = getSubcategories(cat.id);
              const isExpanded = expandedIds.has(cat.id);
              const txCount = getTransactionCountByCategory(cat.id);
              return (
                <div key={cat.id} className="mb-1">
                  <div className="flex items-center gap-3 py-3 border-b border-border/50">
                    {subs.length > 0 && (
                      <button onClick={() => toggleExpand(cat.id)} className="p-0.5 text-muted-foreground">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                      </button>
                    )}
                    <div className={`w-8 h-8 rounded-[10px] ${cat.color} flex items-center justify-center`}>
                      <CategoryIcon name={cat.icon || "circle-dot"} className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] text-foreground font-medium">{cat.name}</span>
                      {txCount > 0 && (
                        <span className="text-[11px] text-muted-foreground ml-2">{txCount} txns</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openCreate(cat.id)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteOrArchive(cat, "archive")} className="p-1.5 text-muted-foreground hover:text-amber-400">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteOrArchive(cat, "delete")} className="p-1.5 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Subcategories */}
                  <AnimatePresence>
                    {isExpanded && subs.map(sub => {
                      const subCount = getTransactionCountByCategory(sub.id);
                      return (
                        <motion.div
                          key={sub.id}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-3 py-2.5 pl-10 border-b border-border/30">
                            <div className={`w-6 h-6 rounded-[8px] ${sub.color} flex items-center justify-center`}>
                              <CategoryIcon name={sub.icon || "circle-dot"} className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] text-foreground">{sub.name}</span>
                              {subCount > 0 && (
                                <span className="text-[11px] text-muted-foreground ml-2">{subCount}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(sub)} className="p-1.5 text-muted-foreground hover:text-foreground">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteOrArchive(sub, "archive")} className="p-1.5 text-muted-foreground hover:text-amber-400">
                                <Archive className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteOrArchive(sub, "delete")} className="p-1.5 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* CREATE / EDIT VIEW */}
        {(view === "create" || view === "edit") && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView("list")} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-[16px] font-display font-semibold text-foreground">
                {view === "edit" ? "Edit Category" : "New Category"}
              </h2>
            </div>

            {/* Name */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Name</label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Category name"
              className="w-full h-11 px-4 rounded-[12px] bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-muted-foreground outline-none transition-colors mb-4"
            />

            {/* Type */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Type</label>
            <div className="flex bg-secondary rounded-full p-0.5 w-fit mb-4">
              {(["expense", "income"] as TransactionType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setFormType(t)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    formType === t ? "bg-card text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t === "expense" ? "Expense" : "Income"}
                </button>
              ))}
            </div>

            {/* Parent */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">
              <FolderInput className="w-3 h-3 inline mr-1" />
              Parent Category (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFormParentId(null)}
                className={`px-3 py-2 rounded-full text-[13px] transition-colors ${
                  formParentId === null
                    ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                    : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                None (root)
              </button>
              {availableParents.map(p => (
                <button
                  key={p.id}
                  onClick={() => setFormParentId(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                    formParentId === p.id
                      ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                      : "bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <div className={`category-dot ${p.color}`} />
                  {p.name}
                </button>
              ))}
            </div>

            {/* Color */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Color</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFormColor(c)}
                  className={`w-8 h-8 rounded-full ${c} transition-all ${
                    formColor === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : ""
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <label className="text-[12px] text-muted-foreground font-medium mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORY_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setFormIcon(ic)}
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${
                    formIcon === ic
                      ? `${formColor} text-white ring-1 ring-foreground/30`
                      : "bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <CategoryIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-[12px] bg-secondary/50 mb-5">
              <div className={`w-10 h-10 rounded-[12px] ${formColor} flex items-center justify-center`}>
                <CategoryIcon name={formIcon} className="w-5 h-5 text-white" />
              </div>
              <span className="text-[14px] text-foreground font-medium">{formName || "Preview"}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView("list")} className="flex-1 h-11 rounded-[12px] bg-secondary text-foreground font-medium text-[14px]">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="flex-[2] h-11 rounded-[12px] bg-primary text-primary-foreground font-medium text-[14px] disabled:opacity-40"
              >
                {view === "edit" ? "Save Changes" : "Create"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ARCHIVED VIEW */}
        {view === "archived" && (
          <motion.div key="archived" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView("list")} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-[16px] font-display font-semibold text-foreground">Archived Categories</h2>
            </div>
            {archivedCats.length === 0 && (
              <p className="text-muted-foreground text-[13px] text-center py-8">No archived categories.</p>
            )}
            {archivedCats.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 py-3 border-b border-border/50">
                <div className={`w-8 h-8 rounded-[10px] ${cat.color} opacity-50 flex items-center justify-center`}>
                  <CategoryIcon name={cat.icon || "circle-dot"} className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[14px] text-muted-foreground">{cat.name}</span>
                  <span className="text-[11px] text-muted-foreground/60 ml-2">{cat.type}</span>
                </div>
                <button
                  onClick={() => onUnarchive(cat.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArchiveRestore className="w-3 h-3" />
                  Restore
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* REASSIGN VIEW */}
        {view === "reassign" && reassignCat && (
          <motion.div key="reassign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView("list")} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-[16px] font-display font-semibold text-foreground">
                {reassignAction === "delete" ? "Delete" : "Archive"} "{reassignCat.name}"
              </h2>
            </div>

            <div className="p-4 rounded-[12px] bg-secondary/50 mb-4">
              <p className="text-[13px] text-foreground mb-1">
                This category has <span className="font-mono-data text-primary">{getTransactionCountByCategory(reassignCat.id)}</span> transactions.
              </p>
              <p className="text-[12px] text-muted-foreground">
                Do you want to move them to another category first?
              </p>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSkipReassign(false)}
                className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors ${
                  !skipReassign ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                Move transactions
              </button>
              <button
                onClick={() => { setSkipReassign(true); setReassignTargetId(""); }}
                className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors ${
                  skipReassign ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                Keep as-is
              </button>
            </div>

            {!skipReassign && (
              <>
                <label className="text-[12px] text-muted-foreground font-medium mb-2 block">Move to:</label>
                <div className="flex flex-wrap gap-2 mb-4 max-h-[200px] overflow-auto">
                  {reassignOptions.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setReassignTargetId(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                        reassignTargetId === cat.id
                          ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                          : "bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <div className={`category-dot ${cat.color}`} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setView("list")} className="flex-1 h-11 rounded-[12px] bg-secondary text-foreground font-medium text-[14px]">
                Cancel
              </button>
              <button
                onClick={handleReassignConfirm}
                disabled={!skipReassign && !reassignTargetId}
                className={`flex-[2] h-11 rounded-[12px] font-medium text-[14px] disabled:opacity-40 ${
                  reassignAction === "delete"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-amber-500 text-background"
                }`}
              >
                {reassignAction === "delete" ? "Delete" : "Archive"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
