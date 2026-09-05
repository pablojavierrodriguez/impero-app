import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppIntegrationStatus {
  phoneNumber: string | null;
  isVerified: boolean;
  isActive: boolean;
  defaultAccountId: string | null;
}

/**
 * Obtiene el estado actual de la integración de WhatsApp del usuario autenticado
 */
export async function getWhatsAppStatus(): Promise<WhatsAppIntegrationStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("whatsapp_integrations")
    .select("phone_number, is_verified, is_active, default_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      phoneNumber: null,
      isVerified: false,
      isActive: false,
      defaultAccountId: null,
    };
  }

  return {
    phoneNumber: data.phone_number,
    isVerified: data.is_verified,
    isActive: data.is_active,
    defaultAccountId: data.default_account_id,
  };
}

/**
 * Genera o actualiza el registro de integración con un código OTP de 6 dígitos
 */
export async function generateWhatsAppOtp(phoneNumber: string): Promise<{ code: string; expiresAt: Date }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // Sanitizar número E.164 básico (eliminar espacios y guiones)
  const sanitizedPhone = phoneNumber.replace(/[\s-]/g, "");

  // Generar código numérico criptográficamente aleatorio de 6 dígitos
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (100000 + (array[0] % 900000)).toString();

  // Expira en 15 minutos
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Verificar si ya existe registro
  const { data: existing } = await supabase
    .from("whatsapp_integrations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("whatsapp_integrations")
      .update({
        phone_number: sanitizedPhone,
        verification_otp: code,
        otp_expires_at: expiresAt.toISOString(),
        is_verified: false,
        is_active: true,
      })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("whatsapp_integrations")
      .insert({
        user_id: user.id,
        phone_number: sanitizedPhone,
        verification_otp: code,
        otp_expires_at: expiresAt.toISOString(),
        is_verified: false,
        is_active: true,
      });

    if (error) throw error;
  }

  return { code, expiresAt };
}

/**
 * Desvincula o desactiva la integración de WhatsApp del usuario
 */
export async function unlinkWhatsApp(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { error } = await supabase
    .from("whatsapp_integrations")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}
