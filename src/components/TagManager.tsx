import { useState } from "react";
import { Plus, Trash2, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { Tag, CATEGORY_COLORS } from "@/lib/types";
import { useSettings } from "@/lib/settings-store";

interface TagManagerProps {
  tags: Tag[];
  onAdd: (tag: Tag) => void;
  onUpdate: (id: string, updates: Partial<Tag>) => void;
  onDelete: (id: string) => void;
  getTransactionCountByTag: (tagId: string) => number;
}

export function TagManager({ tags, onAdd, onUpdate, onDelete, getTransactionCountByTag }: TagManagerProps) {
  const { t } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  const handleAdd = () => {
    if (!name) return;
    onAdd({ id: Date.now().toString(), name, color });
    setName(""); setShowForm(false);
  };

  return (
    <div className="pt-4 pb-4">
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-display font-semibold text-foreground">{t("tag.title")}</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{t("tag.subtitle")}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="mx-4 mb-4 p-4 rounded-[16px] bg-card border border-border/50">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t("tag.namePlaceholder")}
            className="w-full h-10 px-3 rounded-[10px] bg-input border border-border text-foreground text-[14px] mb-3 focus:outline-none focus:ring-1 focus:ring-ring" />
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block">{t("acct.color")}</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORY_COLORS.slice(0, 8).map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full ${c} ${color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} />
            ))}
          </div>
          <button onClick={handleAdd} disabled={!name}
            className="w-full h-10 rounded-[10px] bg-primary text-primary-foreground text-[14px] font-medium disabled:opacity-40">
            {t("common.save")}
          </button>
        </motion.div>
      )}

      <div className="px-4 space-y-2">
        {tags.length === 0 && !showForm && (
          <p className="text-center text-[13px] text-muted-foreground py-8">{t("tag.noTags")}</p>
        )}
        {tags.map(tag => {
          const count = getTransactionCountByTag(tag.id);
          return (
            <motion.div key={tag.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 rounded-[12px] bg-card border border-border/50">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full ${tag.color} flex items-center justify-center`}>
                  <Hash className="w-3 h-3 text-white" />
                </div>
                <span className="text-[14px] font-medium text-foreground">{tag.name}</span>
                <span className="text-[11px] text-muted-foreground">{count} {t("tag.txCount")}</span>
              </div>
              <button onClick={() => onDelete(tag.id)} className="p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
