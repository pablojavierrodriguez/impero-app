import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  ChevronDown,
  Check,
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowLeftRight,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { Account, Transaction, Category } from "@/lib/types";
import {
  parseCsvText,
  guessMapping,
  rowsToTransactions,
  isPotentialDuplicate,
  CsvRow,
  ColumnMapping,
} from "@/lib/csv-parser";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface CsvImportSheetProps {
  open: boolean;
  onClose: () => void;
  onImport: (txs: Transaction[]) => void;
  accounts: Account[];
  categories?: Category[];
  existingTransactions?: Transaction[];
}

type Step = "upload" | "mapping" | "preview";

interface PreviewItem {
  tx: Transaction;
  selected: boolean;
  isDuplicate: boolean;
  projectFuture?: boolean;
}

export function CsvImportSheet({
  open,
  onClose,
  onImport,
  accounts,
  categories = [],
  existingTransactions = [],
}: CsvImportSheetProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: "",
    description: "",
    amount: "",
    type: "",
    debit: "",
    credit: "",
    installments: "",
  });
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [projectAllFuture, setProjectAllFuture] = useState(true);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({ date: "", description: "", amount: "", type: "", debit: "", credit: "", installments: "" });
    setPreviewItems([]);
    setError("");
    setIsImporting(false);
    setProjectAllFuture(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (file: File) => {
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCsvText(text);
      if (h.length < 2 || r.length === 0) {
        setError("No se encontraron datos válidos o columnas en el archivo.");
        return;
      }
      setHeaders(h);
      setRows(r);
      const guessed = guessMapping(h);
      setMapping(guessed);
      setStep("mapping");
    };
    reader.onerror = () => {
      setError("Error al leer el archivo seleccionado.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleGeneratePreview = () => {
    if (!mapping.date || (!mapping.amount && !mapping.debit && !mapping.credit)) {
      setError("Mapeá al menos fecha y la columna de importe o débito/crédito.");
      return;
    }

    const txs = rowsToTransactions(rows, mapping, accountId, categories.length > 0 ? categories : undefined);

    const items: PreviewItem[] = txs.map((tx) => {
      const isDup = isPotentialDuplicate(
        { date: tx.date, amount: tx.amount, description: tx.description, accountId },
        existingTransactions
      );
      return {
        tx,
        selected: !isDup,
        isDuplicate: isDup,
        projectFuture: tx.installmentInfo && tx.installmentInfo.current < tx.installmentInfo.total ? true : false,
      };
    });

    setPreviewItems(items);
    setStep("preview");
  };

  const toggleSelectAll = () => {
    const allSelected = previewItems.every((item) => item.selected);
    setPreviewItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const toggleSelectItem = (index: number) => {
    setPreviewItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleProjectFuture = (index: number) => {
    setPreviewItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, projectFuture: !item.projectFuture } : item))
    );
  };

  const updateItemCategory = (index: number, categoryId: string) => {
    const selectedCat = categories.find((c) => c.id === categoryId);
    if (!selectedCat) return;

    setPreviewItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              tx: { ...item.tx, category: selectedCat },
            }
          : item
      )
    );
  };

  const toggleIsTransfer = (index: number) => {
    setPreviewItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextIsTransfer = !item.tx.isTransfer;
        let newCategory = item.tx.category;

        if (nextIsTransfer) {
          const transferCat = categories.find((c) => c.id === "transfer" || /transfer/i.test(c.name));
          if (transferCat) {
            newCategory = transferCat;
          }
        }

        return {
          ...item,
          tx: {
            ...item.tx,
            isTransfer: nextIsTransfer,
            category: newCategory,
          },
        };
      })
    );
  };

  const selectedCount = previewItems.filter((i) => i.selected).length;
  const duplicateCount = previewItems.filter((i) => i.isDuplicate).length;
  const installmentsCount = previewItems.filter((i) => i.tx.installmentInfo).length;
  const transfersCount = previewItems.filter((i) => i.tx.isTransfer).length;

  const totalProjectedTxs = useMemo(() => {
    let count = 0;
    for (const item of previewItems) {
      if (item.selected && item.projectFuture && item.tx.installmentInfo) {
        const remaining = item.tx.installmentInfo.total - item.tx.installmentInfo.current;
        if (remaining > 0) count += remaining;
      }
    }
    return count;
  }, [previewItems]);

  const summary = useMemo(() => {
    const selectedItems = previewItems.filter((i) => i.selected);
    const regularIncome = selectedItems.filter((i) => i.tx.type === "income" && !i.tx.isTransfer);
    const regularExpense = selectedItems.filter((i) => i.tx.type === "expense" && !i.tx.isTransfer);
    const transfers = selectedItems.filter((i) => i.tx.isTransfer);

    const incomeTotal = selectedItems
      .filter((i) => i.tx.type === "income")
      .reduce((s, i) => s + i.tx.amount, 0);
    const expenseTotal = selectedItems
      .filter((i) => i.tx.type === "expense")
      .reduce((s, i) => s + i.tx.amount, 0);
    const net = incomeTotal - expenseTotal;

    return {
      total: selectedItems.length,
      incomeCount: regularIncome.length,
      expenseCount: regularExpense.length,
      transferCount: transfers.length,
      net,
    };
  }, [previewItems]);

  const handleImport = async () => {
    const selectedList = previewItems.filter((i) => i.selected);
    if (selectedList.length === 0) {
      setError("Seleccioná al menos un movimiento para importar.");
      return;
    }

    // Construir lista final: transacciones base + cuotas proyectadas a futuro si está activo
    const toImport: Transaction[] = [];
    for (const item of selectedList) {
      toImport.push(item.tx);
      if (item.projectFuture && item.tx.installmentInfo) {
        const futureTxs = generateFutureInstallments(item.tx, {
          paymentDay: selectedAccount?.paymentDay,
          closingDay: selectedAccount?.closingDay,
        });
        toImport.push(...futureTxs);
      }
    }

    try {
      setIsImporting(true);
      await onImport(toImport);
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${toImport.length} movimientos (${selectedList.length} extracto + ${toImport.length - selectedList.length} cuotas futuras).`,
      });
      handleClose();
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al persistir los movimientos.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-card border border-border/80 rounded-t-[28px] md:rounded-[24px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/40 flex-shrink-0">
              <button
                onClick={handleClose}
                aria-label="Cerrar modal"
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <span className="text-[16px] font-display font-semibold text-foreground block">
                  Importar Extracto Bancario
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {step === "upload" && "Paso 1: Archivo CSV"}
                  {step === "mapping" && "Paso 2: Mapeo de Columnas"}
                  {step === "preview" && "Paso 3: Conciliación & Preview"}
                </span>
              </div>
              <div className="w-10" />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* Step Body */}
            <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(92vh-80px)] w-full">
              <AnimatePresence mode="wait">
                {/* STEP 1: Upload */}
                {step === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 w-full overflow-x-hidden"
                  >
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-border/80 hover:border-primary/80 rounded-[20px] p-8 flex flex-col items-center gap-3 cursor-pointer bg-secondary/15 hover:bg-secondary/30 transition-all duration-200"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[15px] text-foreground font-medium">
                          Arrastrá tu extracto o hacé clic para buscar
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          Archivos CSV o TXT delimitados por comas o punto y coma
                        </p>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-[12px] bg-destructive/10 border border-destructive/20 text-destructive text-[13px]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-[12px] text-muted-foreground font-medium">Bancos y billeteras compatibles:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Mercado Pago",
                          "Banco Galicia",
                          "Santander",
                          "BBVA",
                          "Brubank",
                          "Ualá",
                          "Extracto Visa / Master",
                          "Excel exportado",
                        ].map((b) => (
                          <span
                            key={b}
                            className="px-3 py-1 rounded-full bg-secondary/60 text-[12px] text-muted-foreground border border-border/40"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Mapping */}
                {step === "mapping" && (
                  <motion.div
                    key="mapping"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 w-full min-w-0 overflow-x-hidden"
                  >
                    <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-secondary/40 border border-border/50">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-[13px] text-foreground font-medium truncate max-w-[200px] md:max-w-none">
                          {fileName || "Extracto cargado"}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-mono">
                        {rows.length} filas · {headers.length} col.
                      </Badge>
                    </div>

                    {/* Account Selector */}
                    <div>
                      <label className="text-[13px] text-foreground font-medium mb-2.5 block">
                        Cuenta bancaria de destino
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {accounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => setAccountId(acc.id)}
                            className={`flex items-center gap-2 p-2.5 rounded-[12px] text-left transition-all border ${
                              accountId === acc.id
                                ? "bg-secondary text-foreground border-primary/40 ring-1 ring-primary/40 font-medium"
                                : "bg-card hover:bg-secondary/30 text-muted-foreground border-border/60"
                            }`}
                          >
                            <div className={`category-dot ${acc.color} flex-shrink-0`} />
                            <span className="text-[13px] truncate">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column Selectors */}
                    <div className="space-y-3">
                      <span className="text-[13px] text-foreground font-medium block">
                        Asignación de columnas del CSV
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                        {/* Fecha */}
                        <div className="min-w-0">
                          <label className="text-[12px] text-muted-foreground mb-1 block">Fecha</label>
                          <div className="relative">
                            <select
                              value={mapping.date}
                              onChange={(e) => setMapping((m) => ({ ...m, date: e.target.value }))}
                              className="w-full h-11 px-3.5 pr-8 rounded-[12px] bg-secondary/40 border border-border text-foreground text-[13px] appearance-none outline-none focus:ring-2 focus:ring-primary/30 transition-colors truncate"
                            >
                              {headers.map((h, hIdx) => (
                                <option key={`date-opt-${hIdx}-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {/* Descripción */}
                        <div className="min-w-0">
                          <label className="text-[12px] text-muted-foreground mb-1 block">Concepto / Descripción</label>
                          <div className="relative">
                            <select
                              value={mapping.description}
                              onChange={(e) => setMapping((m) => ({ ...m, description: e.target.value }))}
                              className="w-full h-11 px-3.5 pr-8 rounded-[12px] bg-secondary/40 border border-border text-foreground text-[13px] appearance-none outline-none focus:ring-2 focus:ring-primary/30 transition-colors truncate"
                            >
                              {headers.map((h, hIdx) => (
                                <option key={`desc-opt-${hIdx}-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {/* Importe Único */}
                        <div className="min-w-0">
                          <label className="text-[12px] text-muted-foreground mb-1 block">
                            Importe (con signo o columna única)
                          </label>
                          <div className="relative">
                            <select
                              value={mapping.amount}
                              onChange={(e) => setMapping((m) => ({ ...m, amount: e.target.value }))}
                              className="w-full h-11 px-3.5 pr-8 rounded-[12px] bg-secondary/40 border border-border text-foreground text-[13px] appearance-none outline-none focus:ring-2 focus:ring-primary/30 transition-colors truncate"
                            >
                              <option key="amount-opt-none" value="">(No usar - usar Débito/Crédito)</option>
                              {headers.map((h, hIdx) => (
                                <option key={`amount-opt-${hIdx}-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {/* Tipo opcional */}
                        <div className="min-w-0">
                          <label className="text-[12px] text-muted-foreground mb-1 block">
                            Tipo de Movimiento (opcional)
                          </label>
                          <div className="relative">
                            <select
                              value={mapping.type}
                              onChange={(e) => setMapping((m) => ({ ...m, type: e.target.value }))}
                              className="w-full h-11 px-3.5 pr-8 rounded-[12px] bg-secondary/40 border border-border text-foreground text-[13px] appearance-none outline-none focus:ring-2 focus:ring-primary/30 transition-colors truncate"
                            >
                              <option key="type-opt-none" value="">Detectar por signo (+/-)</option>
                              {headers.map((h, hIdx) => (
                                <option key={`type-opt-${hIdx}-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {/* Débito separado */}
                        <div className="min-w-0">
                          <label className="text-[12px] text-muted-foreground mb-1 block">
                            Columna Débito / Egreso (si existe)
                          </label>
                          <div className="relative">
                            <select
                              value={mapping.debit || ""}
                              onChange={(e) => setMapping((m) => ({ ...m, debit: e.target.value }))}
                              className="w-full h-11 px-3.5 pr-8 rounded-[12px] bg-secondary/40 border border-border text-foreground text-[13px] appearance-none outline-none focus:ring-2 focus:ring-primary/30 transition-colors truncate"
                            >
                              <option key="debit-opt-none" value="">Ninguna</option>
                              {headers.map((h, hIdx) => (
                                <option key={`debit-opt-${hIdx}-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        {/* Crédito separado */}
                        <div className="min-w-0">
                          <label className="text-[12px] text-muted-foreground mb-1 block">
                            Columna Crédito / Ingreso (si existe)
                          </label>
                          <div className="relative">
                            <select
                              value={mapping.credit || ""}
                              onChange={(e) => setMapping((m) => ({ ...m, credit: e.target.value }))}
                              className="w-full h-11 px-3.5 pr-8 rounded-[12px] bg-secondary/40 border border-border text-foreground text-[13px] appearance-none outline-none focus:ring-2 focus:ring-primary/30 transition-colors truncate"
                            >
                              <option key="credit-opt-none" value="">Ninguna</option>
                              {headers.map((h, hIdx) => (
                                <option key={`credit-opt-${hIdx}-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview de la primera fila */}
                    {rows.length > 0 && (
                      <div className="p-3.5 rounded-[16px] bg-secondary/30 border border-border/40 min-w-0 overflow-hidden">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Muestra: Fila 1 de datos
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] min-w-0">
                          {headers.slice(0, 6).map((h, hIdx) => (
                            <div key={`sample-head-${hIdx}-${h}`} className="min-w-0 truncate">
                              <span className="text-muted-foreground truncate">{h}: </span>
                              <span className="text-foreground font-mono-data font-medium truncate">{rows[0][h] || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-[12px] bg-destructive/10 border border-destructive/20 text-destructive text-[13px]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={reset}
                        className="flex-1 h-12 rounded-[14px] bg-secondary hover:bg-secondary/80 text-foreground font-medium text-[14px] transition-colors"
                      >
                        Cambiar archivo
                      </button>
                      <button
                        type="button"
                        onClick={handleGeneratePreview}
                        className="flex-[2] h-12 rounded-[14px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[14px] shadow-sm transition-all"
                      >
                        Continuar a conciliación
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Preview & Reconciliation */}
                {step === "preview" && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5 w-full min-w-0 overflow-x-hidden"
                  >
                    {/* Resumen de totales */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-[16px] bg-secondary/50 border border-border/40 text-center">
                        <p className="text-[20px] font-mono-data font-semibold text-foreground">{summary.total}</p>
                        <p className="text-[11px] text-muted-foreground">Seleccionadas</p>
                      </div>
                      <div className="p-3 rounded-[16px] bg-secondary/50 border border-border/40 text-center">
                        <p className="text-[20px] font-mono-data font-semibold text-primary">{summary.incomeCount}</p>
                        <p className="text-[11px] text-muted-foreground">Ingresos</p>
                      </div>
                      <div className="p-3 rounded-[16px] bg-secondary/50 border border-border/40 text-center">
                        <p className="text-[20px] font-mono-data font-semibold text-destructive">
                          {summary.expenseCount}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Gastos</p>
                      </div>
                      <div className="p-3 rounded-[16px] bg-secondary/50 border border-border/40 text-center">
                        <p className="text-[20px] font-mono-data font-semibold text-sky-500">
                          {summary.transferCount}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Transferencias</p>
                      </div>
                    </div>

                    {/* Impacto neto */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[16px] bg-card border border-border/70 min-w-0">
                      <div className="min-w-0">
                        <span className="text-[12px] text-muted-foreground block truncate">Impacto Neto en Cuenta</span>
                        <span
                          className={`font-mono-data text-[20px] font-semibold truncate block ${
                            summary.net >= 0 ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {summary.net >= 0 ? "+" : "-"}$
                          {Math.abs(summary.net).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {duplicateCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[12px] flex-shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{duplicateCount} posibles duplicados</span>
                        </div>
                      )}
                    </div>

                    {/* Toolbar de selección y opción de proyección de cuotas */}
                    <div className="flex flex-col gap-2 pt-1 border-b border-border/40 pb-3 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground font-medium py-1 px-2 -ml-2 rounded-[8px] hover:bg-secondary transition-colors flex-shrink-0"
                        >
                          {selectedCount === previewItems.length ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          <span>{selectedCount === previewItems.length ? "Deseleccionar todo" : "Seleccionar todo"}</span>
                        </button>

                        <span className="text-[12px] text-muted-foreground truncate">
                          {selectedCount} seleccionados {totalProjectedTxs > 0 && `(+${totalProjectedTxs} cuotas proyectadas)`}
                        </span>
                      </div>

                      {installmentsCount > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[12px] bg-primary/5 border border-primary/20 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-[12px] text-foreground font-medium truncate">
                              Se detectaron {installmentsCount} compras en cuotas
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !projectAllFuture;
                              setProjectAllFuture(nextVal);
                              setPreviewItems((prev) =>
                                prev.map((item) => ({
                                  ...item,
                                  projectFuture:
                                    item.tx.installmentInfo &&
                                    item.tx.installmentInfo.current < item.tx.installmentInfo.total
                                      ? nextVal
                                      : false,
                                }))
                              );
                            }}
                            className="text-[11px] font-medium text-primary hover:underline flex-shrink-0"
                          >
                            {projectAllFuture ? "Desactivar proyección futura" : "Proyectar cuotas futuras"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lista interactiva de movimientos */}
                    <div className="max-h-[340px] overflow-y-auto overflow-x-hidden space-y-2 pr-1 divide-y divide-border/30 w-full min-w-0">
                      {previewItems.map((item, idx) => {
                        const { tx, selected, isDuplicate, projectFuture } = item;
                        const hasRemainingInstallments =
                          tx.installmentInfo && tx.installmentInfo.current < tx.installmentInfo.total;

                        return (
                          <div
                            key={tx.id}
                            className={`pt-2.5 pb-2 px-2.5 rounded-[14px] transition-all flex flex-col gap-2 min-w-0 ${
                              selected ? "bg-secondary/35" : "opacity-45 hover:opacity-75 bg-transparent"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="pt-1 flex-shrink-0">
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={() => toggleSelectItem(idx)}
                                  className="w-4 h-4 rounded-[5px]"
                                />
                              </div>

                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                  <p className="text-[13px] text-foreground font-medium truncate min-w-0">{tx.description}</p>
                                  <span
                                    className={`font-mono-data text-[14px] font-semibold flex-shrink-0 whitespace-nowrap ${
                                      tx.type === "income" ? "text-primary" : "text-foreground"
                                    }`}
                                  >
                                    {tx.type === "expense" ? "-" : "+"}$
                                    {tx.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-1.5 min-w-0">
                                  <span className="text-[11px] text-muted-foreground font-mono flex-shrink-0">
                                    {tx.date.toLocaleDateString("es-AR", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>

                                  {/* Badges especiales y toggle de transferencia */}
                                  <button
                                    type="button"
                                    onClick={() => toggleIsTransfer(idx)}
                                    title={tx.isTransfer ? "Hacé clic para desmarcar como transferencia propia" : "Hacé clic para marcar como transferencia entre cuentas propias"}
                                    className={`inline-flex items-center gap-1 text-[10px] py-0 px-2 h-5 rounded-full font-medium transition-all flex-shrink-0 border ${
                                      tx.isTransfer
                                        ? "bg-sky-500/15 text-sky-500 border-sky-500/30 hover:bg-sky-500/25"
                                        : "bg-secondary/40 hover:bg-secondary/70 text-muted-foreground border-border/60"
                                    }`}
                                  >
                                    <ArrowLeftRight className="w-2.5 h-2.5" />
                                    <span>{tx.isTransfer ? "Transferencia propia" : "Marcar transf."}</span>
                                  </button>

                                  {tx.installmentInfo && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0 px-1.5 h-4 bg-primary/10 text-primary border-primary/30 font-medium flex-shrink-0"
                                    >
                                      Cuota {tx.installmentInfo.current}/{tx.installmentInfo.total}
                                    </Badge>
                                  )}

                                  {tx.isCardPayment && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0 px-1.5 h-4 bg-sky-500/10 text-sky-500 border-sky-500/30 font-medium flex-shrink-0"
                                    >
                                      Pago de Resumen
                                    </Badge>
                                  )}

                                  {isDuplicate && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] py-0 px-1.5 h-4 bg-amber-500/20 text-amber-500 border border-amber-500/30 font-normal flex-shrink-0"
                                    >
                                      Posible duplicado
                                    </Badge>
                                  )}

                                  {/* Selector rápido de categoría por fila */}
                                  <div className="relative inline-flex items-center ml-auto max-w-[160px] sm:max-w-[200px]">
                                    <select
                                      value={tx.category.id}
                                      onChange={(e) => updateItemCategory(idx, e.target.value)}
                                      className="h-6 pl-2 pr-6 rounded-[8px] bg-background border border-border/80 text-[11px] text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary truncate w-full"
                                    >
                                      {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                  </div>
                                </div>

                                {/* Opción de proyectar cuotas restantes de esta compra */}
                                {hasRemainingInstallments && selected && (
                                  <div className="mt-2 pt-1.5 border-t border-border/30 flex flex-wrap items-center justify-between gap-1 text-[11px] min-w-0">
                                    <span className="text-muted-foreground truncate">
                                      Restan {tx.installmentInfo!.total - tx.installmentInfo!.current} cuotas de $
                                      {tx.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                    </span>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-primary flex-shrink-0">
                                      <input
                                        type="checkbox"
                                        checked={projectFuture}
                                        onChange={() => toggleProjectFuture(idx)}
                                        className="rounded border-border w-3.5 h-3.5"
                                      />
                                      <span>Proyectar meses futuros</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-[12px] bg-destructive/10 border border-destructive/20 text-destructive text-[13px]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep("mapping")}
                        disabled={isImporting}
                        className="flex-1 h-12 rounded-[14px] bg-secondary hover:bg-secondary/80 text-foreground font-medium text-[14px] transition-colors"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={isImporting || selectedCount === 0}
                        className="flex-[2] h-12 rounded-[14px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isImporting ? "Importando..." : `Importar ${selectedCount} seleccionados`}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
