import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, SlidersHorizontal } from "lucide-react";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface MonthSelectorProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
  onCustomizeDashboard?: () => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function MonthSelector({ currentDate, onChangeDate, onCustomizeDashboard }: MonthSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const isCurrentMonth = isSameMonth(currentDate, now);

  const handlePrev = () => {
    onChangeDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    onChangeDate(addMonths(currentDate, 1));
  };

  const handleGoToday = () => {
    onChangeDate(new Date());
    setPickerOpen(false);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const updated = new Date(currentDate);
    updated.setMonth(monthIndex);
    onChangeDate(updated);
    setPickerOpen(false);
  };

  const formattedMonth = format(currentDate, "MMMM yyyy", { locale: es });
  const displayLabel = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-3 py-1.5 rounded-[var(--card-radius,24px)] bg-secondary/40 border border-border/40 backdrop-blur-md shadow-xs transition-all">
        {/* Flecha izquierda (mes anterior) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Mes anterior"
          className="w-8 h-8 theme-pill-btn flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botón central: Mes activo con selector */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPickerOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1 theme-pill-btn hover:bg-secondary/70 active:scale-98 transition-all group"
          >
            <Calendar className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-[13px] font-semibold text-foreground font-display tracking-tight">
              {displayLabel}
            </span>
          </button>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleGoToday}
              title="Volver al mes actual"
              className="px-2.5 py-0.5 theme-pill-btn bg-primary/15 text-primary text-[10px] font-semibold hover:bg-primary/25 active:scale-95 transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Hoy
            </button>
          )}
        </div>

        {/* Flechas y acciones derecha */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNext}
            aria-label="Mes siguiente"
            className="w-8 h-8 theme-pill-btn flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {onCustomizeDashboard && (
            <button
              type="button"
              onClick={onCustomizeDashboard}
              title="Personalizar Dashboard"
              aria-label="Personalizar Dashboard"
              className="w-8 h-8 theme-pill-btn flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 transition-all ml-0.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover cuadrícula de 12 meses */}
      <AnimatePresence>
        {pickerOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setPickerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-12 z-50 p-3 rounded-[var(--card-radius,24px)] bg-card/95 border border-border/80 backdrop-blur-xl shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/40 px-1">
                <span className="text-xs font-semibold text-foreground font-display">
                  Año {currentDate.getFullYear()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prevYear = new Date(currentDate);
                      prevYear.setFullYear(prevYear.getFullYear() - 1);
                      onChangeDate(prevYear);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextYear = new Date(currentDate);
                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                      onChangeDate(nextYear);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES.map((name, idx) => {
                  const isSelected = currentDate.getMonth() === idx;
                  const isCurrent = now.getMonth() === idx && now.getFullYear() === currentDate.getFullYear();
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={`py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : isCurrent
                          ? "bg-secondary text-foreground ring-1 ring-primary/40 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border/40 flex justify-end">
                <button
                  type="button"
                  onClick={handleGoToday}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Volver al mes actual
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
