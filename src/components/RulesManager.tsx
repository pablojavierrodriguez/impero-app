import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Zap, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Category, TransactionRule, RuleCondition, RuleField, RuleOperator } from "@/lib/types";

interface RulesManagerProps {
  rules: TransactionRule[];
  categories: Category[];
  onAddRule: (rule: TransactionRule) => void;
  onUpdateRule: (id: string, updates: Partial<TransactionRule>) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onApplyRetroactively: () => void;
}

export function RulesManager({
  rules,
  categories,
  onAddRule,
  onDeleteRule,
  onToggleRule,
  onApplyRetroactively,
}: RulesManagerProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [conditionField, setConditionField] = useState<RuleField>("description");
  const [conditionOperator, setConditionOperator] = useState<RuleOperator>("contains");
  const [conditionValue, setConditionValue] = useState("");
  const [actionCategory, setActionCategory] = useState("");
  const [actionTags, setActionTags] = useState("");
  const [actionCleanDesc, setActionCleanDesc] = useState("");

  const handleCreate = () => {
    if (!ruleName.trim() || !conditionValue.trim()) {
      toast.error("Por favor completa el nombre y valor de la condición.");
      return;
    }

    const newRule: TransactionRule = {
      id: `rule-${Date.now()}`,
      name: ruleName.trim(),
      isActive: true,
      priority: rules.length + 1,
      conditions: [
        {
          field: conditionField,
          operator: conditionOperator,
          value: conditionField === "amount" ? Number(conditionValue) : conditionValue.trim(),
        },
      ],
      actions: {
        setCategoryId: actionCategory || undefined,
        addTags: actionTags
          ? actionTags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
        cleanDescription: actionCleanDesc.trim() || undefined,
      },
      createdAt: new Date(),
    };

    onAddRule(newRule);
    toast.success("Regla creada con éxito");
    setRuleName("");
    setConditionValue("");
    setActionCategory("");
    setActionTags("");
    setActionCleanDesc("");
    setOpenCreate(false);
  };

  const handleRunRetroactive = () => {
    onApplyRetroactively();
    toast.success("Reglas aplicadas a todo el historial existente.");
  };

  return (
    <div className="pt-4 pb-28 px-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-[20px] font-display font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Automatizaciones & Reglas
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Auto-categoriza y etiqueta transacciones según su concepto o monto.
          </p>
        </div>

        <div className="flex gap-2">
          {rules.length > 0 && (
            <button
              onClick={handleRunRetroactive}
              className="px-3 py-1.5 rounded-xl bg-secondary text-[12px] font-medium text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
              title="Aplicar reglas al historial de transacciones pasadas"
            >
              <Play className="w-3.5 h-3.5 text-primary fill-primary" />
              Ejecutar en Historial
            </button>
          )}

          <button
            onClick={() => setOpenCreate(true)}
            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2 mt-2">
        {rules.length === 0 && (
          <div className="p-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-border/60">
            <Zap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[13px] font-medium text-foreground">No tienes reglas creadas todavía</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-sm mx-auto">
              Crea reglas como: *"Si el concepto contiene 'Coto' → Asignar categoría Supermercado y tag 'comida'"*.
            </p>
          </div>
        )}

        {rules.map((rule) => {
          const cat = categories.find((c) => c.id === rule.actions.setCategoryId);
          return (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border transition-all ${
                rule.isActive
                  ? "bg-card border-border/70 shadow-xs"
                  : "bg-secondary/20 border-border/30 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-foreground truncate">{rule.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        rule.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {rule.isActive ? "Activa" : "Pausada"}
                    </span>
                  </div>

                  {rule.conditions.map((cond, i) => (
                    <div key={i} className="text-[12px] text-muted-foreground flex items-center gap-1">
                      <span className="font-semibold text-foreground">SI</span>
                      <span>{cond.field}</span>
                      <span className="font-mono-data text-primary">{cond.operator}</span>
                      <span className="font-medium text-foreground">"{cond.value}"</span>
                    </div>
                  ))}

                  <div className="text-[12px] text-muted-foreground flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-semibold text-foreground">ENTONCES:</span>
                    {cat && (
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px]">
                        Categoría: {cat.name}
                      </span>
                    )}
                    {rule.actions.addTags?.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px]">
                        #{tag}
                      </span>
                    ))}
                    {rule.actions.cleanDescription && (
                      <span className="text-[11px] text-muted-foreground">
                        → Nombre: "{rule.actions.cleanDescription}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground text-xs"
                    title={rule.isActive ? "Pausar regla" : "Activar regla"}
                  >
                    {rule.isActive ? "Pausar" : "Activar"}
                  </button>
                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Dialog / Modal */}
      <AnimatePresence>
        {openCreate && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border p-5 rounded-2xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h2 className="text-[16px] font-display font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Nueva Regla Automática
                </h2>
                <button onClick={() => setOpenCreate(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Nombre descriptivo de la regla
                </label>
                <input
                  type="text"
                  placeholder="Ej: Clasificar Coto como Supermercado"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full h-10 px-3 bg-secondary rounded-xl text-[14px] text-foreground border border-border/50 outline-none focus:border-primary"
                />
              </div>

              {/* Condition Builder */}
              <div className="p-3 bg-secondary/40 rounded-xl space-y-2 border border-border/40">
                <label className="text-[11px] uppercase tracking-wider text-primary font-bold block">
                  Condición (Disparador)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value as RuleField)}
                    className="bg-secondary rounded-lg px-2.5 py-2 text-[13px] text-foreground border border-border outline-none"
                  >
                    <option value="description">Descripción</option>
                    <option value="amount">Monto</option>
                    <option value="type">Tipo</option>
                  </select>

                  <select
                    value={conditionOperator}
                    onChange={(e) => setConditionOperator(e.target.value as RuleOperator)}
                    className="bg-secondary rounded-lg px-2.5 py-2 text-[13px] text-foreground border border-border outline-none"
                  >
                    <option value="contains">Contiene</option>
                    <option value="starts_with">Comienza con</option>
                    <option value="equals">Es igual a</option>
                    {conditionField === "amount" && <option value="greater_than">Mayor a</option>}
                    {conditionField === "amount" && <option value="less_than">Menor a</option>}
                  </select>

                  <input
                    type="text"
                    placeholder="Texto o número..."
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="bg-secondary rounded-lg px-2.5 py-2 text-[13px] text-foreground border border-border outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Action Builder */}
              <div className="p-3 bg-secondary/40 rounded-xl space-y-2.5 border border-border/40">
                <label className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">
                  Acción a Ejecutar Automáticamente
                </label>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Asignar Categoría:</label>
                  <select
                    value={actionCategory}
                    onChange={(e) => setActionCategory(e.target.value)}
                    className="w-full bg-secondary rounded-lg px-2.5 py-2 text-[13px] text-foreground border border-border outline-none"
                  >
                    <option value="">-- Sin cambio de categoría --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Agregar Etiquetas (separadas por coma):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: comida, deducible, super"
                    value={actionTags}
                    onChange={(e) => setActionTags(e.target.value)}
                    className="w-full bg-secondary rounded-lg px-2.5 py-2 text-[13px] text-foreground border border-border outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Limpiar o Normalizar Nombre (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Reemplazar por 'Coto'"
                    value={actionCleanDesc}
                    onChange={(e) => setActionCleanDesc(e.target.value)}
                    className="w-full bg-secondary rounded-lg px-2.5 py-2 text-[13px] text-foreground border border-border outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-[13px] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold"
                >
                  Crear Regla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
