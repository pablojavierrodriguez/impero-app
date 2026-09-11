import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Shield, LogOut, Loader2, AlertCircle } from "lucide-react";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-store";

export function BiometricLockOverlay() {
  const { isAppLocked, unlockWithBiometrics } = usePrivacy();
  const { signOut, user } = useAuth();
  const { t } = useSettings();
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlock = useCallback(async () => {
    try {
      setIsVerifying(true);
      setErrorMessage(null);
      const success = await unlockWithBiometrics();
      if (!success) {
        setErrorMessage(t("biometrics.errorCancel"));
      }
    } catch (err) {
      console.warn("Unlock attempt failed:", err);
      setErrorMessage(t("biometrics.errorGeneric"));
    } finally {
      setIsVerifying(false);
    }
  }, [unlockWithBiometrics, t]);

  // Si no está bloqueada la app o no hay usuario autenticado, no renderizar
  if (!isAppLocked || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-2xl"
      >
        <motion.div
          initial={{ scale: 0.94, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-sm flex flex-col items-center text-center"
        >
          {/* Aura / Shield Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
              <Fingerprint className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2 mb-8">
            <span className="text-[11px] font-mono tracking-widest uppercase text-primary font-semibold block">
              {t("biometrics.tag")}
            </span>
            <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">
              {t("biometrics.title")}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-4">
              {t("biometrics.description")}
            </p>
          </div>

          {/* Feedback de error si hubo cancelación o fallo */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isVerifying}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("biometrics.verifying")}</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>{t("biometrics.unlockButton")}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full h-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("biometrics.signOutSecure")}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
