import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, ChevronDown, Check, AlertCircle } from "lucide-react";
import { Account, Transaction } from "@/lib/types";
import {
  parseCsvText,
  guessMapping,
  rowsToTransactions,
  CsvRow,
  ColumnMapping,
} from "@/lib/csv-parser";

interface CsvImportSheetProps {
  open: boolean;
  onClose: () => void;
  onImport: (txs: Transaction[]) => void;
  accounts: Account[];
}

type Step = "upload" | "mapping" | "preview";

export function CsvImportSheet({ open, onClose, onImport, accounts }: CsvImportSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: "", description: "", amount: "", type: "" });
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [preview, setPreview] = useState<Transaction[]>([]);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({ date: "", description: "", amount: "", type: "" });
    setPreview([]);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCsvText(text);
      if (h.length < 2 || r.length === 0) {
        setError("No se encontraron datos válidos en el archivo.");
        return;
      }
      setHeaders(h);
      setRows(r);
      const guessed = guessMapping(h);
      setMapping(guessed);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleGeneratePreview = () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      setError("Mapeá al menos fecha, descripción y monto.");
      return;
    }
    const txs = rowsToTransactions(rows, mapping, accountId);
    setPreview(txs);
    setStep("preview");
  };

  const handleImport = () => {
    onImport(preview);
    handleClose();
  };

  const incomeCount = preview.filter(t => t.type === "income").length;
  const expenseCount = preview.filter(t => t.type === "expense").length;
  const totalAmount = preview.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            onClick={e => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[24px] max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <button onClick={handleClose} className="p-2 -ml-2 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
              <span className="text-[15px] font-display font-semibold text-foreground">Importar CSV</span>
              <div className="w-9" />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <AnimatePresence mode="wait">
              {/* Step 1: Upload */}
              {step === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-8"
                >
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-[16px] p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-muted-foreground transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] text-foreground font-medium">Subí tu extracto bancario</p>
                      <p className="text-[12px] text-muted-foreground mt-1">CSV o TXT — separado por comas o punto y coma</p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 mt-4 text-destructive text-[13px]">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div className="mt-6 space-y-2">
                    <p className="text-[12px] text-muted-foreground font-medium">Formatos soportados</p>
                    <div className="flex flex-wrap gap-2">
                      {["Banco (CSV)", "Tarjeta de crédito", "Excel → CSV"].map(f => (
                        <span key={f} className="px-3 py-1.5 rounded-full bg-secondary/50 text-[12px] text-muted-foreground">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Column mapping */}
              {step === "mapping" && (
                <motion.div
                  key="mapping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 pb-8"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-[13px] text-muted-foreground">
                      {rows.length} filas encontradas · {headers.length} columnas
                    </span>
                  </div>

                  {/* Account selector */}
                  <div className="mb-4">
                    <span className="text-[12px] text-muted-foreground font-medium mb-2 block">Cuenta destino</span>
                    <div className="flex flex-wrap gap-2">
                      {accounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => setAccountId(acc.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] transition-colors ${
                            accountId === acc.id
                              ? "bg-secondary text-foreground ring-1 ring-muted-foreground/30"
                              : "bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          <div className={`category-dot ${acc.color}`} />
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column mapping */}
                  <span className="text-[12px] text-muted-foreground font-medium mb-3 block">Mapeo de columnas</span>
                  {(["date", "description", "amount", "type"] as const).map(field => (
                    <div key={field} className="mb-3">
                      <label className="text-[12px] text-muted-foreground capitalize mb-1 block">
                        {field === "date" ? "Fecha" : field === "description" ? "Descripción" : field === "amount" ? "Monto" : "Tipo (opcional)"}
                      </label>
                      <div className="relative">
                        <select
                          value={mapping[field]}
                          onChange={e => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                          className="w-full h-10 px-3 pr-8 rounded-[12px] bg-input border border-border text-foreground text-[13px] appearance-none outline-none focus:border-muted-foreground transition-colors"
                        >
                          {field === "type" && <option value="">Auto-detectar por signo</option>}
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  ))}

                  {/* Sample row */}
                  {rows.length > 0 && (
                    <div className="mt-4 p-3 rounded-[12px] bg-secondary/30 border border-border/50">
                      <p className="text-[11px] text-muted-foreground mb-2">Primera fila de ejemplo:</p>
                      <div className="space-y-1">
                        {headers.map(h => (
                          <div key={h} className="flex justify-between text-[12px]">
                            <span className="text-muted-foreground">{h}</span>
                            <span className="text-foreground font-mono-data">{rows[0][h]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 mt-3 text-destructive text-[13px]">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { reset(); }}
                      className="flex-1 h-12 rounded-[12px] bg-secondary text-foreground font-medium text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleGeneratePreview}
                      className="flex-[2] h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] active:scale-[0.98] transition-all"
                    >
                      Preview
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Preview */}
              {step === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 pb-8"
                >
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-3 rounded-[12px] bg-secondary/50 text-center">
                      <p className="text-[20px] font-mono-data text-foreground">{preview.length}</p>
                      <p className="text-[11px] text-muted-foreground">Total</p>
                    </div>
                    <div className="p-3 rounded-[12px] bg-secondary/50 text-center">
                      <p className="text-[20px] font-mono-data text-primary">{incomeCount}</p>
                      <p className="text-[11px] text-muted-foreground">Ingresos</p>
                    </div>
                    <div className="p-3 rounded-[12px] bg-secondary/50 text-center">
                      <p className="text-[20px] font-mono-data text-destructive">{expenseCount}</p>
                      <p className="text-[11px] text-muted-foreground">Gastos</p>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <span className={`font-mono-data text-[24px] ${totalAmount >= 0 ? "text-primary" : "text-destructive"}`}>
                      {totalAmount >= 0 ? "+" : ""}${Math.abs(totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-[12px] text-muted-foreground">Impacto neto</p>
                  </div>

                  {/* Transaction list preview */}
                  <div className="max-h-[280px] overflow-auto space-y-0">
                    {preview.slice(0, 20).map(tx => (
                      <div key={tx.id} className="transaction-row">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`category-dot ${tx.category.color}`} />
                          <div className="min-w-0">
                            <p className="text-[13px] text-foreground truncate">{tx.description}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {tx.date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} · {tx.category.name}
                            </p>
                          </div>
                        </div>
                        <span className={`font-mono-data text-[14px] flex-shrink-0 ${tx.type === "income" ? "text-primary" : "text-foreground"}`}>
                          {tx.type === "expense" ? "-" : "+"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {preview.length > 20 && (
                      <p className="text-[12px] text-muted-foreground text-center py-3">
                        +{preview.length - 20} transacciones más
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("mapping")}
                      className="flex-1 h-12 rounded-[12px] bg-secondary text-foreground font-medium text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex-[2] h-12 rounded-[12px] bg-primary text-primary-foreground font-medium text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Importar {preview.length}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
