import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
                ? "w-full bg-card/95 backdrop-blur-2xl rounded-t-[var(--card-radius)] border-t border-border/50 max-h-[90vh] overflow-y-auto shadow-2xl"
                : "w-full max-w-lg bg-card/95 backdrop-blur-2xl rounded-[var(--card-radius)] shadow-2xl border border-border/60 max-h-[85vh] overflow-y-auto"
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
              {title && (
                <span className="text-[15px] font-display font-semibold text-foreground">{title}</span>
              )}
              <div className="w-9 flex justify-end">{titleRight}</div>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
