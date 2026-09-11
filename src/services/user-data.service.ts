import { supabase } from "@/integrations/supabase/client";
import { CACHE_KEYS, GLOBAL_QUEUE_KEY } from "@/services/sync-queue.service";
import { SHOPPING_CACHE_KEY, SHOPPING_QUEUE_KEY } from "@/services/shopping.service";

/**
 * Elimina todos los registros de negocio del usuario en Supabase
 * respetando las dependencias de clave foránea (Foreign Keys) y políticas RLS.
 */
export async function purgeRemoteUserData(userId: string): Promise<void> {
  // 1. Listas de compras y sus artículos
  try {
    const { data: userLists } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("user_id", userId);

    if (userLists && userLists.length > 0) {
      const listIds = userLists.map((l) => l.id);
      await supabase.from("shopping_list_items").delete().in("list_id", listIds);
    }
    await supabase.from("shopping_lists").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar listas de compras:", err);
  }

  // 2. Reglas automáticas de categorización
  try {
    await (supabase.from("transaction_rules" as any) as any).delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar reglas:", err);
  }

  // 3. Recordatorios de pago y transacciones periódicas
  try {
    await supabase.from("bill_reminders").delete().eq("user_id", userId);
    await supabase.from("recurring_transactions").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar vencimientos y recurrentes:", err);
  }

  // 4. Presupuestos y metas financieras
  try {
    await supabase.from("budgets").delete().eq("user_id", userId);
    await supabase.from("goals").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar presupuestos y metas:", err);
  }

  // 5. Transacciones históricas
  try {
    await supabase.from("transactions").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar transacciones:", err);
  }

  // 6. Etiquetas (Tags)
  try {
    await supabase.from("tags").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar etiquetas:", err);
  }

  // 7. Cuentas y tarjetas de crédito
  try {
    await supabase.from("accounts").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar cuentas:", err);
  }

  // 8. Categorías (primero subcategorías por parent_id FK, luego categorías raíz)
  try {
    await supabase.from("categories").delete().eq("user_id", userId).not("parent_id", "is", null);
    await supabase.from("categories").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[UserDataService] Error al purgar categorías:", err);
  }

  // 9. Integraciones auxiliares (WhatsApp)
  try {
    await supabase.from("whatsapp_messages").delete().eq("user_id", userId);
    await supabase.from("whatsapp_integrations").delete().eq("user_id", userId);
  } catch {
    // Silencioso si no están habilitadas
  }
}

/**
 * Limpia de manera exhaustiva todo rastro de caché offline, colas diferidas
 * y estados de onboarding en el almacenamiento local del dispositivo.
 */
export function purgeLocalUserData(): void {
  // 1. Caches principales del motor offline
  Object.values(CACHE_KEYS).forEach((cacheKey) => {
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // Ignorar errores de storage restringido
    }
  });

  // 2. Colas de sincronización
  try {
    localStorage.removeItem(GLOBAL_QUEUE_KEY);
    localStorage.removeItem(SHOPPING_CACHE_KEY);
    localStorage.removeItem(SHOPPING_QUEUE_KEY);
  } catch {
    // Silencioso
  }

  // 3. Flags de bienvenida y versión
  try {
    localStorage.removeItem("onboarding-complete");
    localStorage.removeItem("onboarding-current-step");
    localStorage.removeItem("onboarding-temp-currency");
    localStorage.removeItem("onboarding-temp-accounts");
    localStorage.removeItem("impero_last_seen_release");
  } catch {
    // Silencioso
  }

  // 4. Claves de compatibilidad y legacy
  const legacyKeys = [
    "impero-finance-data",
    "impero-transactions",
    "impero-accounts",
    "impero-categories",
    "shopping_lists",
    "local_bills",
    "local_recurring",
    "local_budgets",
    "local_goals",
    "local_tags",
  ];

  legacyKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silencioso
    }
  });
}

/**
 * Orquesta la purga integral de datos del usuario (remota si aplica y local siempre).
 */
export async function purgeAllUserData(userId?: string): Promise<void> {
  if (userId) {
    await purgeRemoteUserData(userId);
  }
  purgeLocalUserData();
}
