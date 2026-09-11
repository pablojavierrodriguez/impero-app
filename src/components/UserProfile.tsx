import { useState, useEffect } from "react";
import { User, Mail, Camera, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  email: string;
  avatar_url: string;
}

export function UserProfilePage() {
  const { t } = useSettings();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({ name: "", email: user?.email || "", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, email, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile({ name: data.name || "", email: data.email || user.email || "", avatar_url: data.avatar_url || "" });
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: profile.name, avatar_url: profile.avatar_url })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(t("profile.saveError"));
    else toast.success(t("profile.saveSuccess"));
  };

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="pt-4 px-4 max-w-lg mx-auto">
      <h1 className="text-[20px] font-display font-semibold text-foreground mb-6">
        {t("nav.profile")}
      </h1>

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            onClick={() => {
              const url = prompt(t("profile.avatarPrompt"), profile.avatar_url);
              if (url !== null) setProfile(p => ({ ...p, avatar_url: url }));
            }}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <span className="mt-2 text-xs text-muted-foreground">{user?.email}</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block uppercase tracking-wider">
            {t("profile.nameLabel")}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder={t("profile.namePlaceholder")}
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground text-[14px] placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-[12px] text-muted-foreground font-medium mb-1 block uppercase tracking-wider">
            {t("profile.emailLabel")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground/50 text-[14px] outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={saveProfile} disabled={saving} className="w-full gap-2">
          {saving ? t("profile.saving") : t("profile.saveChanges")}
        </Button>
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          {t("nav.logout")}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          {t("profile.privacyNote")}
        </p>
      </div>
    </div>
  );
}
