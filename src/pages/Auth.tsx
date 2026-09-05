import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";

const isSignupEnabled = import.meta.env.VITE_ENABLE_SIGNUP === "true";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
      } else if (mode === "signup") {
        if (!isSignupEnabled) {
          throw new Error("El registro de nuevos usuarios está deshabilitado en esta instancia privada.");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada! Revisá tu email para confirmar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Te enviamos un email para restablecer tu contraseña.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border/60 bg-background/50 flex items-center justify-center mb-4 shadow-lg">
            <img src="/icons/icon.svg" alt="m3 logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">m3</h1>
          <p className="text-xs font-medium text-primary tracking-wider uppercase mb-1">Money • Mind • Mastery</p>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" && "Iniciá sesión para continuar"}
            {mode === "signup" && "Creá tu cuenta gratuita"}
            {mode === "forgot" && "Recuperá tu contraseña"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nombre completo"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                required
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  className="w-full h-12 pl-10 pr-12 rounded-xl bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl gap-2 text-base font-semibold"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Iniciar sesión"}
                  {mode === "signup" && "Crear cuenta"}
                  {mode === "forgot" && "Enviar email"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.form>
        </AnimatePresence>

        {isSignupEnabled && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                ¿No tenés cuenta?{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                  Registrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                  Iniciá sesión
                </button>
              </>
            )}
          </div>
        )}
        {!isSignupEnabled && mode !== "login" && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
