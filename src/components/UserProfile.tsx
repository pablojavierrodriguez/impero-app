import { useState, useEffect } from "react";
import { User, Mail, Camera, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings-store";

interface UserProfileData {
  name: string;
  email: string;
  avatar: string;
}

const DEFAULT_PROFILE: UserProfileData = {
  name: "",
  email: "",
  avatar: "",
};

function loadProfile(): UserProfileData {
  try {
    const stored = localStorage.getItem("user-profile");
    return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
  } catch { return DEFAULT_PROFILE; }
}

function saveProfile(p: UserProfileData) {
  localStorage.setItem("user-profile", JSON.stringify(p));
}

export function UserProfilePage() {
  const { t } = useSettings();
  const [profile, setProfile] = useState(loadProfile);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try { return localStorage.getItem("user-logged-in") === "true"; } catch { return false; }
  });

  useEffect(() => { saveProfile(profile); }, [profile]);
  useEffect(() => { localStorage.setItem("user-logged-in", String(isLoggedIn)); }, [isLoggedIn]);

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="pt-4 px-4 max-w-lg mx-auto">
      <h1 className="text-[20px] font-display font-semibold text-foreground mb-6">
        {t("nav.profile") || "Mi Perfil"}
      </h1>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            onClick={() => {
              const url = prompt("URL de avatar (o dejá vacío para quitar):", profile.avatar);
              if (url !== null) setProfile(p => ({ ...p, avatar: url }));
            }}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        {isLoggedIn && (
          <span className="mt-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Conectado
          </span>
        )}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block uppercase tracking-wider">
            Nombre
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Tu nombre"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block uppercase tracking-wider">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="tu@email.com"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Login/Logout */}
      <div className="mt-8">
        {isLoggedIn ? (
          <Button
            variant="outline"
            className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setIsLoggedIn(false)}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        ) : (
          <Button className="w-full gap-2" onClick={() => setIsLoggedIn(true)}>
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          {isLoggedIn
            ? "Tus datos están guardados localmente en este dispositivo."
            : "Iniciá sesión para sincronizar tus datos entre dispositivos."}
        </p>
      </div>
    </div>
  );
}
