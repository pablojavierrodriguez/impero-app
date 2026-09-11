import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/lib/settings-store";

interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  titleRight?: React.ReactNode;
}

/**
 * On mobile: bottom sheet (slides up from bottom).
 * On desktop: centered dialog with backdrop blur.
 */
export function ResponsiveSheet({ open, onClose, children, title, titleRight }: ResponsiveSheetProps) {
  const isMobile = useIsMobile();
  const { t } = useSettings();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-md flex items-end md:items-center md:justify-center p-0 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            onClick={e => e.stopPropagation()}
            className={
              isMobile
                ? "w-full bg-card/95 backdrop-blur-2xl rounded-t-[var(--card-radius)] border-t border-border/50 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl"
                : "w-full max-w-lg bg-card/95 backdrop-blur-2xl rounded-[var(--card-radius)] shadow-2xl border border-border/60 max-h-[85vh] overflow-y-auto no-scrollbar"
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40 gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0"
                  aria-label={t("common.close")}
                >
                  <X className="w-4 h-4" />
                </button>
                {title && (
                  <div className="text-[15px] font-display font-semibold text-foreground truncate min-w-0">
                    {title}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center">
                {titleRight || <div className="w-2" />}
              </div>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
