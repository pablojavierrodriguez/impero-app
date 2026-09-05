import { supabase } from "@/integrations/supabase/client";

export async function uploadReceipt(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("receipts")
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteReceipt(urlOrPath: string): Promise<void> {
  const parts = urlOrPath.split("/receipts/");
  const filePath = parts[1] || urlOrPath;

  const { error } = await supabase.storage.from("receipts").remove([filePath]);
  if (error) console.error("Error al borrar recibo:", error);
}
